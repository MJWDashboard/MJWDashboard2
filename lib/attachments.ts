import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";

/** Compresses images, uploads to the private "attachments" bucket under
 * {owner_id}/{recordTable}/..., and records it in the attachments table. */
export async function uploadAttachment(file: File, recordTable: string, recordId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const isImage = file.type.startsWith("image/");
  const body = isImage ? await compressImage(file) : file;
  const ext = isImage ? "jpg" : file.name.split(".").pop() || "bin";
  const path = `${user.id}/${recordTable}/${recordId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, body, { contentType: isImage ? "image/jpeg" : file.type });
  if (uploadError) return { error: uploadError.message };

  const { error: rowError } = await supabase.from("attachments").insert({
    bucket: "attachments",
    path,
    filename: file.name,
    content_type: isImage ? "image/jpeg" : file.type,
    record_table: recordTable,
    record_id: recordId,
  });
  if (rowError) return { error: rowError.message };

  return { error: null };
}

export async function getAttachmentUrl(path: string, expiresInSeconds = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("attachments").createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteAttachment(id: string, path: string) {
  const supabase = createClient();
  await supabase.storage.from("attachments").remove([path]);
  await supabase.from("attachments").delete().eq("id", id);
}
