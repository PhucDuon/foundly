-- ============================================================
-- StartupMatch — initial schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
    id               uuid references auth.users(id) on delete cascade primary key,
    name             text        not null,
    email            text        not null,
    role             text        not null default 'Other',
    experience_level text        not null default 'Beginner',
    bio              text        not null default '',
    location         text        not null default '',
    skills           text[]      not null default '{}',
    interests        text[]      not null default '{}',
    emoji            text        not null default '🚀',
    created_at       timestamptz not null default now()
);

-- Startup ideas
create table if not exists public.startup_ideas (
    id          uuid        primary key default gen_random_uuid(),
    founder_id  uuid        not null references public.profiles(id) on delete cascade,
    name        text        not null,
    description text        not null default '',
    category    text        not null default '',
    stage       text        not null default 'Idea',
    looking_for text[]      not null default '{}',
    created_at  timestamptz not null default now()
);

-- Swipes
create table if not exists public.swipes (
    id         uuid        primary key default gen_random_uuid(),
    swiper_id  uuid        not null references public.profiles(id) on delete cascade,
    swiped_id  uuid        not null references public.profiles(id) on delete cascade,
    direction  text        not null check (direction in ('left', 'right')),
    created_at timestamptz not null default now(),
    unique (swiper_id, swiped_id)
);

-- Matches
create table if not exists public.matches (
    id         uuid        primary key default gen_random_uuid(),
    user1_id   uuid        not null references public.profiles(id) on delete cascade,
    user2_id   uuid        not null references public.profiles(id) on delete cascade,
    matched_at timestamptz not null default now(),
    unique (user1_id, user2_id)
);

-- Messages
create table if not exists public.messages (
    id        uuid        primary key default gen_random_uuid(),
    match_id  uuid        not null references public.matches(id) on delete cascade,
    sender_id uuid        not null references public.profiles(id) on delete cascade,
    content   text        not null,
    sent_at   timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.startup_ideas enable row level security;
alter table public.swipes        enable row level security;
alter table public.matches       enable row level security;
alter table public.messages      enable row level security;

-- profiles
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_insert_own"  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);

-- startup_ideas
create policy "ideas_select_all"    on public.startup_ideas for select using (true);
create policy "ideas_insert_own"    on public.startup_ideas for insert with check (auth.uid() = founder_id);
create policy "ideas_update_own"    on public.startup_ideas for update using (auth.uid() = founder_id);
create policy "ideas_delete_own"    on public.startup_ideas for delete using (auth.uid() = founder_id);

-- swipes
create policy "swipes_select_own"  on public.swipes for select using (auth.uid() = swiper_id);
create policy "swipes_insert_own"  on public.swipes for insert with check (auth.uid() = swiper_id);

-- matches
create policy "matches_select_own" on public.matches for select
    using (auth.uid() = user1_id or auth.uid() = user2_id);

-- messages
create policy "messages_select" on public.messages for select
    using (
        exists (
            select 1 from public.matches
            where id = match_id
              and (user1_id = auth.uid() or user2_id = auth.uid())
        )
    );
create policy "messages_insert" on public.messages for insert
    with check (
        auth.uid() = sender_id and
        exists (
            select 1 from public.matches
            where id = match_id
              and (user1_id = auth.uid() or user2_id = auth.uid())
        )
    );

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

create index if not exists idx_swipes_swiper  on public.swipes (swiper_id);
create index if not exists idx_swipes_swiped  on public.swipes (swiped_id);
create index if not exists idx_matches_users  on public.matches (user1_id, user2_id);
create index if not exists idx_messages_match on public.messages (match_id, sent_at);
