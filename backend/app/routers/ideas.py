from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.idea import IdeaCreate
from app.services.notifications import send_push

router = APIRouter()


@router.get("")
async def discover_ideas(
    current_user=Depends(get_current_user),
    category: str = Query(default=""),
    sort: str = Query(default="newest"),
    limit: int = 20,
):
    uid = str(current_user.id)
    try:
        result = supabase.rpc("get_discover_ideas", {
            "p_user_id":  uid,
            "p_category": category or None,
            "p_sort":     sort,
            "p_limit":    limit,
        }).execute()
        rows = result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"get_discover_ideas RPC failed: {e}")
    # Re-shape to match what the frontend expects
    return [
        {
            "id":          r["id"],
            "name":        r["name"],
            "description": r["description"],
            "category":    r["category"],
            "stage":       r["stage"],
            "looking_for": r["looking_for"],
            "created_at":  r["created_at"],
            "interest_count": r["interest_count"],
            "founder": {
                "id":         r["founder_id"],
                "name":       r["founder_name"],
                "emoji":      r["founder_emoji"],
                "role":       r["founder_role"],
                "avatar_url": r["founder_avatar_url"],
            },
        }
        for r in rows
    ]


@router.get("/mine")
async def my_ideas(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    result = supabase.rpc("get_my_ideas_with_counts", {"p_user_id": uid}).execute()
    return result.data or []


@router.post("")
async def create_idea(data: IdeaCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    idea_id = supabase.rpc("create_startup_idea", {
        "p_founder_id": uid,
        "p_name": data.name,
        "p_description": data.description,
        "p_category": data.category,
        "p_stage": data.stage,
        "p_looking_for": data.looking_for,
    }).execute().data
    result = supabase.rpc("get_my_ideas_with_counts", {"p_user_id": uid}).execute()
    created = next((i for i in (result.data or []) if i["id"] == idea_id), None)
    return created


@router.put("/{idea_id}")
async def update_idea(idea_id: str, data: IdeaCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    founder_res = supabase.rpc("get_idea_founder", {"p_idea_id": idea_id}).execute()
    if not founder_res.data or founder_res.data != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")
    supabase.rpc("update_startup_idea", {
        "p_idea_id": idea_id,
        "p_founder_id": uid,
        "p_name": data.name,
        "p_description": data.description,
        "p_category": data.category,
        "p_stage": data.stage,
        "p_looking_for": data.looking_for,
    }).execute()
    result = supabase.rpc("get_my_ideas_with_counts", {"p_user_id": uid}).execute()
    updated = next((i for i in (result.data or []) if i["id"] == idea_id), None)
    return updated


@router.get("/{idea_id}/interests")
async def get_idea_interests(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    founder_res = supabase.rpc("get_idea_founder", {"p_idea_id": idea_id}).execute()
    if not founder_res.data or founder_res.data != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")

    result = supabase.rpc("get_idea_interested_profiles", {
        "p_idea_id": idea_id,
        "p_founder_id": uid,
    }).execute()
    return result.data or []


@router.post("/{idea_id}/accept/{user_id}")
async def accept_interest(idea_id: str, user_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    founder_res = supabase.rpc("get_idea_founder", {"p_idea_id": idea_id}).execute()
    if not founder_res.data or founder_res.data != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")
    match_id = supabase.rpc("create_idea_match", {
        "p_user_id": user_id, "p_founder_id": uid,
    }).execute().data
    return {"match": {"id": match_id}}


@router.post("/{idea_id}/interest")
async def express_interest(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)

    rows = supabase.rpc("get_idea_with_founder", {"p_idea_id": idea_id}).execute()
    if not rows.data:
        raise HTTPException(status_code=404, detail="Idea not found.")
    row = rows.data[0]
    founder_id = row["founder_id"]

    if founder_id == uid:
        raise HTTPException(status_code=400, detail="Cannot express interest in your own idea.")

    supabase.rpc("insert_idea_interest", {"p_user_id": uid, "p_idea_id": idea_id}).execute()

    match_id = supabase.rpc("create_idea_match", {
        "p_user_id": uid, "p_founder_id": founder_id
    }).execute().data

    me = supabase.table("profiles").select("name").eq("id", uid).single().execute()
    my_name = me.data["name"] if me.data else "Someone"
    await send_push(
        row.get("push_token"),
        "🚀 New Interest!",
        f"{my_name} is interested in {row['idea_name']}!",
        {"type": "idea_interest", "match_id": match_id},
    )

    return {
        "matched": True,
        "match": {"id": match_id},
        "founder": {
            "id": founder_id,
            "name": row["founder_name"],
            "emoji": row["founder_emoji"],
            "role": row["founder_role"],
        },
    }


@router.delete("/{idea_id}")
async def delete_idea(idea_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    founder_res = supabase.rpc("get_idea_founder", {"p_idea_id": idea_id}).execute()
    if not founder_res.data:
        raise HTTPException(status_code=404, detail="Idea not found.")
    if founder_res.data != uid:
        raise HTTPException(status_code=403, detail="Not your idea.")
    supabase.rpc("delete_startup_idea", {"p_idea_id": idea_id, "p_founder_id": uid}).execute()
    return {"message": "Deleted."}
