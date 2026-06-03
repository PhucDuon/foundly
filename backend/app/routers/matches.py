from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.match import SwipeRequest, SwipeResponse
from app.services.notifications import send_push
from app.utils import compute_compatibility

router = APIRouter()


@router.post("/swipe", response_model=SwipeResponse)
async def swipe(data: SwipeRequest, current_user=Depends(get_current_user)):
    uid = str(current_user.id)

    result = supabase.rpc("process_swipe", {
        "p_swiper_id": uid,
        "p_swiped_id": data.swiped_id,
        "p_direction": data.direction,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Swipe processing failed.")

    # Notify the other user about a brand-new match
    if result.data.get("matched") and result.data.get("is_new"):
        me = supabase.table("profiles").select("name").eq("id", uid).single().execute()
        other = supabase.table("profiles").select("name, push_token").eq("id", data.swiped_id).single().execute()
        my_name = me.data["name"] if me.data else "Someone"
        if other.data and other.data.get("push_token"):
            await send_push(
                other.data["push_token"],
                "🎉 New Match!",
                f"You matched with {my_name}! Say hello 👋",
                {"type": "match", "match_id": result.data["match"]["id"]},
            )

    return result.data


@router.get("")
async def get_matches(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    matches = (
        supabase.table("matches")
        .select("*, user1:profiles!user1_id(*), user2:profiles!user2_id(*)")
        .or_(f"user1_id.eq.{uid},user2_id.eq.{uid}")
        .execute()
    )
    if not matches.data:
        return []

    # Attach last message time so we can sort by most recent activity
    enriched = []
    for m in matches.data:
        last = (
            supabase.table("messages")
            .select("sent_at")
            .eq("match_id", m["id"])
            .order("sent_at", desc=True)
            .limit(1)
            .execute()
        )
        last_at = last.data[0]["sent_at"] if last.data else m["matched_at"]
        enriched.append({**m, "last_message_at": last_at})

    enriched.sort(key=lambda x: x["last_message_at"], reverse=True)

    # Tag matches that have unread messages
    unread = supabase.rpc("get_unread_match_ids", {"p_user_id": uid}).execute()
    unread_ids = set(unread.data or [])
    for m in enriched:
        m["has_unread"] = m["id"] in unread_ids

    return enriched


@router.get("/likes")
async def get_likes(current_user=Depends(get_current_user)):
    """People who swiped right on me that I haven't responded to yet."""
    uid = str(current_user.id)

    profiles = supabase.rpc("get_likes", {"p_user_id": uid}).execute()
    if not profiles.data:
        return []

    my_profile = supabase.table("profiles").select("*").eq("id", uid).single().execute()

    result = [
        {**p, "compatibility_score": compute_compatibility(my_profile.data or {}, p)}
        for p in profiles.data
    ]
    result.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return result


@router.delete("/{match_id}")
async def unmatch(match_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    try:
        supabase.rpc("unmatch_users", {"p_match_id": match_id, "p_user_id": uid}).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Unmatched."}
