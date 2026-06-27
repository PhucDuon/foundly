from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.match import SwipeRequest, SwipeResponse
from app.services.notifications import get_profile_name, push_to_user
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

    if result.data.get("matched") and result.data.get("is_new"):
        # Mutual match — tell both sides
        my_name = await get_profile_name(uid)
        await push_to_user(
            data.swiped_id,
            "🎉 New Match!",
            f"You matched with {my_name}! Say hello 👋",
            {"type": "match", "match_id": result.data["match"]["id"]},
        )
    elif data.direction == "right" and not result.data.get("matched"):
        # One-sided like — nudge them to open the app
        await push_to_user(
            data.swiped_id,
            "💜 Someone liked you!",
            "Open Foundly to see who and connect instantly.",
            {"type": "like"},
        )

    return result.data


@router.get("")
async def get_matches(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    result = supabase.rpc("get_matches_for_user", {"p_user_id": uid}).execute()
    return result.data or []


@router.get("/my-likes")
async def get_my_likes(current_user=Depends(get_current_user)):
    """People I swiped right on who haven't matched back yet."""
    uid = str(current_user.id)
    result = supabase.rpc("get_my_likes", {"p_user_id": uid}).execute()
    return result.data or []


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
