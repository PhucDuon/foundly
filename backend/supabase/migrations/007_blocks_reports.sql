-- Blocks
create table if not exists public.blocks (
    id         uuid        primary key default gen_random_uuid(),
    blocker_id uuid        not null references public.profiles(id) on delete cascade,
    blocked_id uuid        not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;
create policy "blocks_own" on public.blocks using (auth.uid() = blocker_id);

-- Reports
create table if not exists public.reports (
    id          uuid        primary key default gen_random_uuid(),
    reporter_id uuid        not null references public.profiles(id) on delete cascade,
    reported_id uuid        not null references public.profiles(id) on delete cascade,
    reason      text        not null,
    created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;
create policy "reports_insert" on public.reports for insert
    with check (auth.uid() = reporter_id);
