create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity_type, entity_id);
