-- ============================================================
-- TaskFlow Schema — Full Migration
-- Order: tables -> indexes -> RLS -> triggers
-- ============================================================

-- 0. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- 1. TABLES
-- ============================================================

-- 1a. Profiles (synced with auth.users via trigger below)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- 1b. Projects
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id),
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  created_at  timestamptz not null default now()
);

-- 1c. Tasks
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 500),
  description text,
  status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'done')),
  priority    int not null default 2
                check (priority between 1 and 3),
  assignee_id uuid references public.profiles(id),
  due_date    date,
  position    real not null default 0,
  created_at  timestamptz not null default now()
);

-- 1d. Project Members (Stage 3)
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  role       text not null default 'member'
               check (role in ('owner', 'member')),
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),

  primary key (project_id, user_id)
);

-- 1e. Comments (Stage 4)
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- 1f. Activity Events (Stage 4)
create table public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);


-- 2. INDEXES
-- ============================================================
create index idx_projects_owner         on public.projects(owner_id);

create index idx_tasks_project          on public.tasks(project_id);
create index idx_tasks_assignee         on public.tasks(assignee_id);
create index idx_tasks_status           on public.tasks(status);
create index idx_tasks_due_date         on public.tasks(due_date);

create index idx_project_members_user   on public.project_members(user_id);

create index idx_comments_task          on public.comments(task_id);
create index idx_comments_author        on public.comments(author_id);
create index idx_comments_created       on public.comments(created_at desc);

create index idx_activity_project       on public.activity_events(project_id);
create index idx_activity_created       on public.activity_events(created_at desc);
create index idx_activity_project_time  on public.activity_events(project_id, created_at desc);


-- 3. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.tasks           enable row level security;
alter table public.project_members enable row level security;
alter table public.comments        enable row level security;
alter table public.activity_events enable row level security;

-- 3a. Profiles
create policy "Profiles are readable by all authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3b. Projects
create policy "Projects readable by owner and members"
  on public.projects for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.project_members
      where project_id = id and user_id = auth.uid()
    )
  );

create policy "Projects insertable by authenticated users"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Projects updatable by owner"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Projects deletable by owner"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- 3c. Tasks
create policy "Tasks readable by project members"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects p
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Tasks insertable by project members"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects p
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Tasks updatable by project members"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects p
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Tasks deletable by project members"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects p
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

-- 3d. Project Members
create policy "Members readable by project members"
  on public.project_members for select
  using (
    exists (
      select 1 from public.projects p
      left join public.project_members pm2 on pm2.project_id = p.id and pm2.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm2.user_id = auth.uid())
    )
  );

create policy "Members insertable by project owner"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

create policy "Members deletable by project owner"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

-- 3e. Comments
create policy "Comments readable by task viewers"
  on public.comments for select
  using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where t.id = task_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Comments insertable by task viewers"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where t.id = task_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Comments deletable by author or project owner"
  on public.comments for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_id and p.owner_id = auth.uid()
    )
  );

-- 3f. Activity Events
create policy "Activity readable by project members"
  on public.activity_events for select
  using (
    exists (
      select 1 from public.projects p
      left join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = project_id
        and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
    )
  );

create policy "Activity insertable by service"
  on public.activity_events for insert
  with check (true);


-- 4. TRIGGERS
-- ============================================================

-- Auto-create profile row on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
