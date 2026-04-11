-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique not null,
  role_default text check (role_default in ('director','composer','music_supervisor','sound_designer','other')) default 'composer',
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Projects ────────────────────────────────────────────────────────────────
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  format text check (format in ('feature','episodic','short','commercial')) not null default 'feature',
  tone_brief text,
  owner_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Members can read projects"
  on projects for select using (
    auth.uid() = owner_id or
    exists (select 1 from project_members where project_id = projects.id and user_id = auth.uid())
  );

create policy "Owner can update project"
  on projects for update using (auth.uid() = owner_id);

create policy "Authenticated users can create projects"
  on projects for insert with check (auth.uid() = owner_id);

-- ─── Generation Settings ─────────────────────────────────────────────────────
create table generation_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade unique not null,
  instrumentation_families text[] default '{}',
  era_reference text,
  budget_reality text check (budget_reality in ('full_orchestra','small_ensemble','solo_duo','electronic_only','hybrid')) default 'hybrid',
  do_not_generate text,
  model_provider text default 'stable_audio',
  updated_at timestamptz default now()
);

alter table generation_settings enable row level security;

create policy "Members can read generation settings"
  on generation_settings for select using (
    exists (
      select 1 from projects p
      where p.id = project_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members where project_id = p.id and user_id = auth.uid())
      )
    )
  );

create policy "Members can upsert generation settings"
  on generation_settings for all using (
    exists (
      select 1 from projects p
      where p.id = project_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members where project_id = p.id and user_id = auth.uid() and can_edit = true)
      )
    )
  );

-- ─── Project Members ─────────────────────────────────────────────────────────
create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  user_id uuid references profiles on delete cascade,
  role_on_project text check (role_on_project in ('director','composer','music_supervisor','sound_designer','viewer')) not null default 'composer',
  invite_email text,
  magic_token text unique,
  can_edit boolean default true,
  invited_at timestamptz default now(),
  accepted_at timestamptz
);

alter table project_members enable row level security;

create policy "Members can view project members"
  on project_members for select using (
    user_id = auth.uid() or
    exists (
      select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "Owner can manage project members"
  on project_members for all using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ─── Scene Cards ─────────────────────────────────────────────────────────────
create table scene_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  cue_number text,
  label text not null,
  sort_order integer not null default 0,
  tc_in_smpte text,
  tc_out_smpte text,
  picture_version_label text,
  video_file_key text,
  video_duration_sec float,
  status text default 'untagged' check (status in ('untagged','tagged','generating','awaiting_approval','brief_sent','complete')),
  created_at timestamptz default now(),
  created_by uuid references profiles
);

create index on scene_cards (project_id, sort_order);

alter table scene_cards enable row level security;

create policy "Members can read scene cards"
  on scene_cards for select using (
    exists (
      select 1 from projects p
      where p.id = project_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members where project_id = p.id and user_id = auth.uid())
      )
    )
  );

create policy "Members can create scene cards"
  on scene_cards for insert with check (
    exists (
      select 1 from projects p
      where p.id = project_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members where project_id = p.id and user_id = auth.uid() and can_edit = true)
      )
    )
  );

create policy "Members can update scene cards"
  on scene_cards for update using (
    exists (
      select 1 from projects p
      where p.id = project_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members where project_id = p.id and user_id = auth.uid() and can_edit = true)
      )
    )
  );

-- ─── Intent Versions ─────────────────────────────────────────────────────────
create table intent_versions (
  id uuid primary key default gen_random_uuid(),
  scene_card_id uuid references scene_cards on delete cascade not null,
  version_number integer not null,
  emotional_atmospheres text[] not null default '{}',
  narrative_function text,
  density text check (density in ('silence','sparse','textural','melodic','layered','saturated')),
  director_words text,
  what_would_be_wrong text,
  handoff_setting text check (handoff_setting in ('score_forward','sound_forward','equal_negotiated','diegetic_transition','no_music')),
  diegetic_status text check (diegetic_status in ('non_diegetic','diegetic','pseudo_diegetic')),
  frequency_note text,
  positive_prompt text,
  negative_prompt text,
  spec_tempo_range text,
  spec_harmonic_character text,
  spec_density text,
  spec_register text,
  spec_dynamics text,
  spec_rhythm text,
  spec_instrumentation text,
  spec_do_not_use text[],
  spec_confirmed_by uuid references profiles,
  spec_confirmed_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references profiles
);

create index on intent_versions (scene_card_id, version_number desc);

alter table intent_versions enable row level security;

create policy "Scene card members can manage intent versions"
  on intent_versions for all using (
    exists (
      select 1 from scene_cards sc
      join projects p on p.id = sc.project_id
      where sc.id = scene_card_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
      )
    )
  );

-- ─── Generation Jobs ─────────────────────────────────────────────────────────
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  scene_card_id uuid references scene_cards on delete cascade not null,
  intent_version_id uuid references intent_versions on delete cascade not null,
  status text default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  model_provider text not null default 'stable_audio',
  positive_prompt text not null,
  negative_prompt text,
  duration_sec float not null,
  error_message text,
  queued_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references profiles
);

create index on generation_jobs (scene_card_id, status);

alter table generation_jobs enable row level security;

create policy "Members can manage generation jobs"
  on generation_jobs for all using (
    exists (
      select 1 from scene_cards sc
      join projects p on p.id = sc.project_id
      where sc.id = scene_card_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
      )
    )
  );

-- ─── Mock Cues ───────────────────────────────────────────────────────────────
create table mock_cues (
  id uuid primary key default gen_random_uuid(),
  generation_job_id uuid references generation_jobs on delete cascade not null,
  scene_card_id uuid references scene_cards on delete cascade not null,
  intent_version_id uuid references intent_versions on delete cascade not null,
  version_number integer not null,
  file_key text not null,
  file_name text not null,
  duration_sec float not null,
  is_mock boolean not null default true,
  is_approved boolean default false,
  approved_by uuid references profiles,
  approved_at timestamptz,
  composer_acknowledged boolean default false,
  composer_acknowledged_at timestamptz,
  composer_notes text,
  created_at timestamptz default now()
);

create index on mock_cues (scene_card_id, version_number desc);

alter table mock_cues enable row level security;

create policy "Members can manage mock cues"
  on mock_cues for all using (
    exists (
      select 1 from scene_cards sc
      join projects p on p.id = sc.project_id
      where sc.id = scene_card_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
      )
    )
  );

-- ─── Comments ────────────────────────────────────────────────────────────────
create table comments (
  id uuid primary key default gen_random_uuid(),
  scene_card_id uuid references scene_cards on delete cascade not null,
  author_id uuid references profiles on delete set null,
  body text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Members can manage comments"
  on comments for all using (
    exists (
      select 1 from scene_cards sc
      join projects p on p.id = sc.project_id
      where sc.id = scene_card_id and (
        p.owner_id = auth.uid() or
        exists (select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
      )
    )
  );

-- ─── Storage Buckets (run via Supabase dashboard or CLI) ─────────────────────
-- bucket: scene-videos   (private, 500MB limit per file)
-- bucket: mock-cues      (private, 50MB limit per file)
-- Storage policies must be set in the Supabase dashboard after creating buckets.
