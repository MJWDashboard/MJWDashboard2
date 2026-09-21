"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Pin, Plus, Trash2, X, StickyNote, ShoppingCart } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import {
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
  createList,
  deleteList,
  addListItem,
  toggleListItem,
  deleteListItem,
} from "./actions";

type Note = Tables<"notes">;
type List = Tables<"lists">;
type ListItem = Tables<"list_items">;

const LIST_KINDS = ["shopping", "household", "pharmacy", "pet_supplies", "hardware", "other"] as const;

export function NotesListsClient({
  initialNotes,
  initialLists,
  initialItems,
}: {
  initialNotes: Note[];
  initialLists: List[];
  initialItems: ListItem[];
}) {
  const [tab, setTab] = useState<"notes" | "lists">("notes");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Notes & Lists</p>
        <h1 className="text-xl font-semibold text-text">Capture</h1>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "notes"} onClick={() => setTab("notes")} icon={StickyNote} label="Notes" />
        <TabButton active={tab === "lists"} onClick={() => setTab("lists")} icon={ShoppingCart} label="Lists" />
      </div>

      {tab === "notes" ? (
        <NotesTab notes={initialNotes} />
      ) : (
        <ListsTab lists={initialLists} items={initialItems} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof StickyNote;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-accent text-white" : "border border-border text-muted hover:text-text"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function NotesTab({ notes }: { notes: Note[] }) {
  const [pending, startTransition] = useTransition();
  const [draftTitle, setDraftTitle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function handleCreate() {
    if (!draftTitle.trim()) return;
    startTransition(async () => {
      const { data } = await createNote(draftTitle.trim());
      setDraftTitle("");
      if (data) setOpenId(data.id);
    });
  }

  const open = notes.find((n) => n.id === openId);

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2">
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New note title..."
          className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
        />
        <button onClick={handleCreate} disabled={pending} className="text-accent">
          <Plus size={20} />
        </button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" detail="Capture something — it's saved instantly." />
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setOpenId(note.id)}
              className="card flex w-full items-start justify-between gap-2 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{note.title}</p>
                {note.body && <p className="mt-1 line-clamp-2 text-xs text-muted">{note.body}</p>}
              </div>
              {note.pinned && <Pin size={14} className="mt-0.5 shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}

      {open && <NoteEditor note={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateNote(note.id, { title, body });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-surface p-4 lg:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            className="flex-1 bg-transparent text-base font-medium text-text outline-none"
          />
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={save}
          rows={8}
          placeholder="Write..."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-text outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => startTransition(() => togglePinNote(note.id, !note.pinned))}
            className={clsx("flex items-center gap-1.5 text-xs", note.pinned ? "text-accent" : "text-muted")}
          >
            <Pin size={14} />
            {note.pinned ? "Pinned" : "Pin"}
          </button>
          <button
            onClick={() => {
              startTransition(async () => {
                await deleteNote(note.id);
                onClose();
              });
            }}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs text-overdue"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ListsTab({ lists, items }: { lists: List[]; items: ListItem[] }) {
  const [pending, startTransition] = useTransition();
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<(typeof LIST_KINDS)[number]>("shopping");
  const [activeListId, setActiveListId] = useState<string | null>(lists[0]?.id ?? null);

  function handleCreateList() {
    if (!draftName.trim()) return;
    startTransition(async () => {
      await createList(draftName.trim(), draftKind);
      setDraftName("");
    });
  }

  if (lists.length === 0) {
    return (
      <div className="space-y-3">
        <NewListForm
          draftName={draftName}
          setDraftName={setDraftName}
          draftKind={draftKind}
          setDraftKind={setDraftKind}
          onCreate={handleCreateList}
          pending={pending}
        />
        <EmptyState icon={ShoppingCart} title="No lists yet" detail="Start with a shopping list — items check off in one tap." />
      </div>
    );
  }

  const active = lists.find((l) => l.id === activeListId) ?? lists[0];
  const activeItems = items.filter((i) => i.list_id === active.id);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              list.id === active.id ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {list.name}
          </button>
        ))}
      </div>

      <ListDetail list={active} items={activeItems} />

      <NewListForm
        draftName={draftName}
        setDraftName={setDraftName}
        draftKind={draftKind}
        setDraftKind={setDraftKind}
        onCreate={handleCreateList}
        pending={pending}
      />
    </div>
  );
}

function NewListForm({
  draftName,
  setDraftName,
  draftKind,
  setDraftKind,
  onCreate,
  pending,
}: {
  draftName: string;
  setDraftName: (v: string) => void;
  draftKind: (typeof LIST_KINDS)[number];
  setDraftKind: (v: (typeof LIST_KINDS)[number]) => void;
  onCreate: () => void;
  pending: boolean;
}) {
  return (
    <div className="card flex flex-wrap items-center gap-2">
      <input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCreate()}
        placeholder="New list name..."
        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
      />
      <select
        value={draftKind}
        onChange={(e) => setDraftKind(e.target.value as (typeof LIST_KINDS)[number])}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
      >
        {LIST_KINDS.map((k) => (
          <option key={k} value={k}>
            {k.replace("_", " ")}
          </option>
        ))}
      </select>
      <button onClick={onCreate} disabled={pending} className="text-accent">
        <Plus size={20} />
      </button>
    </div>
  );
}

function ListDetail({ list, items }: { list: List; items: ListItem[] }) {
  const [pending, startTransition] = useTransition();
  const [draftItem, setDraftItem] = useState("");
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  function handleAdd() {
    if (!draftItem.trim()) return;
    startTransition(async () => {
      await addListItem(list.id, draftItem.trim());
      setDraftItem("");
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{list.name}</p>
        <button
          onClick={() => startTransition(() => deleteList(list.id))}
          className="text-muted hover:text-overdue"
          aria-label="Delete list"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-3">
        <input
          value={draftItem}
          onChange={(e) => setDraftItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add item..."
          className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
        />
        <button onClick={handleAdd} disabled={pending} className="text-accent">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-1">
        {unchecked.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
        {checked.length > 0 && (
          <>
            <p className="pt-2 text-xs text-muted">Checked</p>
            {checked.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </>
        )}
        {items.length === 0 && <p className="py-4 text-center text-xs text-muted">List is empty</p>}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ListItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => toggleListItem(item.id, !item.checked)}
        className={clsx(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          item.checked ? "border-accent bg-accent" : "border-border"
        )}
        aria-label="Toggle item"
      >
        {item.checked && <div className="h-2 w-2 rounded-full bg-white" />}
      </button>
      <span className={clsx("flex-1 text-sm", item.checked ? "text-muted line-through" : "text-text")}>
        {item.name}
        {item.quantity && <span className="ml-2 text-xs text-muted">{item.quantity}</span>}
      </span>
      <button onClick={() => deleteListItem(item.id)} className="text-muted hover:text-overdue">
        <X size={16} />
      </button>
    </div>
  );
}
