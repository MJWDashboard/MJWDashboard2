insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760) -- 10MB
on conflict (id) do nothing;

-- Path convention: {owner_id}/{record_table}/{filename} — the first path
-- segment is the owner check, so RLS never has to look at the attachments
-- table itself.
create policy "attachments bucket: owner can read own files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments bucket: owner can upload own files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments bucket: owner can delete own files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
