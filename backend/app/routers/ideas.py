from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.idea import IdeaCreate
from app.services.notifications import send_push

router = APIRouter()


@router.get("")
async def discover_ideas(current_user=Depends(get_current_user), limit: int = 20):
    uid = str(current_user.id)

    # Ideas the user already expressed interest in
    interested = supabase.table("idea_interests").select("idea_id").eq("user_id", uid).execute()
    exclude = {i["idea_id"] for i in interested.data}

    ideas = (
        supabase.table("startup_ideas")
        .select("*, founder:profiles!founder_id(id, name, emoji, role, push_token)")
        .neq("founder_id", uid)
        .execute()
    )

    filtered = [i for i in ideas.data if i["id"] not in exclude]
    return filtered[:limit]


@router.get("/mine")
async def my_ideas(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    ideas = supabase.table("startup_ideas").select("*").eq("founder_id", uid).order("created_at", desc=True).execute()
    return ideas.data


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

    # Record interest (ignore duplicate)
    try:
        supabase.table("idea_interests").insert({"user_id": uid, "idea_id": idea_id}).execute()
    except Exception:
        pass

    # Create match immediately (no mutual requirement for ideas)
    m1 = supabase.table("matches").select("id").eq("user1_id", uid).eq("user2_id", founder_id).execute()
    m2 = supabase.table("matches").select("id").eq("user1_id", founder_id).eq("user2_id", uid).execute()

    if m1.data:
        match_id = m1.data[0]["id"]
        is_new = False
    elif m2.data:
        match_id = m2.data[0]["id"]
        is_new = False
    else:
        match = supabase.table("matches").insert({"user1_id": uid, "user2_id": founder_id}).execute()
        match_id = match.data[0]["id"]
        is_new = True

    # Notify the founder only on new match
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
