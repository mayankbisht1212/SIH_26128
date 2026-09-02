-- Persist model outputs and private source media for each authenticated report.
alter table public.reports
  add column if not exists ml_disease text,
  add column if not exists ml_confidence numeric,
  add column if not exists image_path text,
  add column if not exists audio_path text;

insert into storage.buckets (id, name, public)
values ('report-media', 'report-media', false)
on conflict (id) do update set public = false;

create policy "Users manage their own report media" on storage.objects
  for all using (
    bucket_id = 'report-media' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'report-media' and auth.uid()::text = (storage.foldername(name))[1]
  );
