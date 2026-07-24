-- ============================================================================
-- 0006_storage.sql — Storage bucket + RLS for staff resources/assets and
-- expense receipts. Files are stored under a path prefixed with the entity
-- id, e.g. resources/<entity_id>/<filename>, which the policies below key on.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

-- Path convention: the first path segment is always the entity_id, so we can
-- reuse public.can_do() by parsing it out of storage.objects.name.
create policy "resources bucket select" on storage.objects
  for select using (
    bucket_id = 'resources'
    and public.can_do(auth.uid(), (split_part(name, '/', 1))::uuid, 'resources', 'view')
  );

create policy "resources bucket insert" on storage.objects
  for insert with check (
    bucket_id = 'resources'
    and public.can_do(auth.uid(), (split_part(name, '/', 1))::uuid, 'resources', 'edit')
  );

create policy "resources bucket delete" on storage.objects
  for delete using (
    bucket_id = 'resources'
    and public.can_do(auth.uid(), (split_part(name, '/', 1))::uuid, 'resources', 'delete')
  );
