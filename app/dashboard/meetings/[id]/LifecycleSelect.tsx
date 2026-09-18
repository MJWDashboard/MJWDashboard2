"use client";

import { useRouter } from "next/navigation";
import { setMeetingLifecycle } from "../actions";

export function LifecycleSelect({ meetingId, status }: { meetingId: string; status: string }) {
  const router = useRouter();

  async function handleChange(newStatus: string) {
    await setMeetingLifecycle(meetingId, newStatus);
    router.refresh();
  }

  return (
    <select
      className="input w-auto text-sm"
      defaultValue={status}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="draft">Draft</option>
      <option value="scheduled">Scheduled</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
      <option value="archived">Archived</option>
    </select>
  );
}
