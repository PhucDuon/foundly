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
    return matches.data


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
    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found.")
    if uid not in (match.data["user1_id"], match.data["user2_id"]):
        raise HTTPException(status_code=403, detail="Not your match.")
    other_id = match.data["user2_id"] if match.data["user1_id"] == uid else match.data["user1_id"]

    # Delete ALL match records between these two users (handles bidirectional duplicates)
    supabase.table("matches").delete().eq("user1_id", uid).eq("user2_id", other_id).execute()
    supabase.table("matches").delete().eq("user1_id", other_id).eq("user2_id", uid).execute()

    # Clear swipes so neither appears in each other's discover/likes again
    supabase.table("swipes").delete().eq("swiper_id", uid).eq("swiped_id", other_id).execute()
    supabase.table("swipes").delete().eq("swiper_id", other_id).eq("swiped_id", uid).execute()
    return {"message": "Unmatched."}
