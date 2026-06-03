-- Idea discovery with category filter, sort, and interest count
create or replace function get_discover_ideas(
  p_user_id  uuid,
  p_category text    default null,
  p_sort     text    default 'newest',
  p_limit    int     default 20
)
returns table (
  id                  uuid,
  name                text,
  description         text,
  category            text,
  stage               text,
  looking_for         text[],
  created_at          timestamptz,
  interest_count      bigint,
  founder_id          uuid,
  founder_name        text,
  founder_emoji       text,
  founder_role        text,
  founder_avatar_url  text
)
security definer
language sql
as $$
  select
    si.id,
    si.name,
    si.description,
    si.category,
    si.stage,
    si.looking_for,
    si.created_at,
    count(ii.id)      as interest_count,
    p.id              as founder_id,
    p.name            as founder_name,
    p.emoji           as founder_emoji,
    p.role            as founder_role,
    p.avatar_url      as founder_avatar_url
  from public.startup_ideas si
  join public.profiles p on p.id = si.founder_id
  left join public.idea_interests ii on ii.idea_id = si.id
  where si.founder_id != p_user_id
    and si.id not in (
      select idea_id from public.idea_interests where user_id = p_user_id
    )
    and (p_category is null or p_category = '' or si.category = p_category)
  group by si.id, p.id
  order by
    case when p_sort = 'popular' then count(ii.id) else 0 end desc,
    si.created_at desc
  limit p_limit;
$$;
