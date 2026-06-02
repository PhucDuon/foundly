from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.idea import IdeaCreate
from app.services.notifications import send_push

router = APIRouter()


@router.get("")
async def discover_ideas(current_user=Depends(get_current_user), limit: int = 20):
    uid = str(current_user.id)

    interested = supabase.table("idea_interests").select("idea_id").eq("user_id", uid).execute()
    exclude = {i["idea_id"] for i in interested.data}

    ideas = (
        supabase.table("startup_ideas")
        .select("*, founder:profiles!founder_id(id, name, emoji, role, avatar_url, push_token)")
        .neq("founder_id", uid)
        .execute()
    )

    filtered = [i for i in ideas.data if i["id"] not in exclude]
    return filtered[:limit]


@router.get("/mine")
async def my_ideas(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    result = supabase.rpc("get_my_ideas_with_counts", {"p_user_id": uid}).execute()
    return result.data or []


@router.post("")
async def create_idea(data: IdeaCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    idea = supabase.table("startup_ideas").insert({
        "founder_id": uid,
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "stage": data.stage,
        "looking_for": data.looking_for,
    }).execute()
    return idea.data[0]


@router.put("/{idea_id}")
async def update_idea(idea_id: str, data: IdeaCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    idea = supabase.table("startup_ideas").select("founder_id").eq("id", idea_id).single().execute()
    if not idea.data or idea.data["founder_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")
    supabase.table("startup_ideas").update({
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "stage": data.stage,
        "looking_for": data.looking_for,
    }).eq("id", idea_id).execute()
    result = supabase.table("startup_ideas").select("*").eq("id", idea_id).single().execute()
    return result.data


@router.get("/{idea_id}/interests")
async def get_idea_interests(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    idea = supabase.table("startup_ideas").select("founder_id").eq("id", idea_id).single().execute()
    if not idea.data or idea.data["founder_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")

    result = supabase.rpc("get_idea_interested_profiles", {
        "p_idea_id": idea_id,
        "p_founder_id": uid,
    }).execute()
    return result.data or []


@router.post("/{idea_id}/interest")
async def express_interest(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)

    idea = (
        supabase.table("startup_ideas")
        .select("*, founder:profiles!founder_id(id, name, emoji, role, push_token)")
        .eq("id", idea_id)
        .single()
        .execute()
    )
    if not idea.data:
        raise HTTPException(status_code=404, detail="Idea not found.")

    founder = idea.data["founder"]
    founder_id = idea.data["founder_id"]

    if founder_id == uid:
        raise HTTPException(status_code=400, detail="Cannot express interest in your own idea.")

    try:
        supabase.table("idea_interests").insert({"user_id": uid, "idea_id": idea_id}).execute()
    except Exception:
        pass

    prev_count = supabase.table("matches").select("id").or_(
        f"and(user1_id.eq.{uid},user2_id.eq.{founder_id}),and(user1_id.eq.{founder_id},user2_id.eq.{uid})"
    ).execute()
    is_new = not bool(prev_count.data)
    match_id = supabase.rpc("create_idea_match", {
        "p_user_id": uid, "p_founder_id": founder_id
    }).execute().data

    if is_new:
        me = supabase.table("profiles").select("name").eq("id", uid).single().execute()
        my_name = me.data["name"] if me.data else "Someone"
        await send_push(
            founder.get("push_token"),
            "🚀 New Interest!",
            f"{my_name} is interested in {idea.data['name']}!",
            {"type": "idea_interest", "match_id": match_id},
        )

    return {
        "matched": True,
        "match": {"id": match_id},
        "founder": {
            "id": founder_id,
            "name": founder["name"],
            "emoji": founder["emoji"],
            "role": founder["role"],
        },
    }


@router.delete("/{idea_id}")
async def delete_idea(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    idea = supabase.table("startup_ideas").select("founder_id").eq("id", idea_id).single().execute()
    if not idea.data:
        raise HTTPException(status_code=404, detail="Idea not found.")
    if idea.data["founder_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")
    supabase.table("startup_ideas").delete().eq("id", idea_id).execute()
    return {"message": "Deleted."}
