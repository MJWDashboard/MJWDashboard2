"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const file = formData.get("file") as File | null;
  const buildingId = (formData.get("building_id") as string) || null;
  const tenantId = (formData.get("tenant_id") as string) || null;
  const category = (formData.get("category") as string) || null;

  if (!file || file.size === 0) return { error: "Please choose a file." };

  const supabase = createClient();
  const path = `${user.organizationId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    building_id: buildingId,
    tenant_id: tenantId,
    category,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type || null,
    organization_id: user.organizationId,
    uploaded_by: user.id,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/documents");
  return { error: null };
}

export async function getDocumentUrl(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 60 * 5);

  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
