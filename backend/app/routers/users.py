from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.user import UserProfileUpdate
from app.utils import role_to_emoji, compute_compatibility

router = APIRouter()


@router.get("/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    profile = supabase.table("profiles").select("*").eq("id", str(current_user.id)).single().execute()
    return profile.data


@router.put("/me")
async def update_my_profile(data: UserProfileUpdate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    updates = data.model_dump(exclude_none=True)
    if "role" in updates:
        updates["emoji"] = role_to_emoji(updates["role"])
    supabase.table("profiles").update(updates).eq("id", uid).execute()
    profile = supabase.table("profiles").select("*").eq("id", uid).single().execute()
    return profile.data


@router.put("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    content = await file.read()
    path = f"{uid}/avatar.jpg"

    # upsert=true handles both new uploads and overwrites
    supabase.storage.from_("avatars").upload(
        path=path,
        file=content,
        file_options={"content-type": file.content_type or "image/jpeg", "upsert": "true"},
    )

    url = supabase.storage.from_("avatars").get_public_url(path)
    supabase.table("profiles").update({"avatar_url": url}).eq("id", uid).execute()
    return {"avatar_url": url}


@router.post("/me/push-token")
async def save_push_token(body: dict, current_user=Depends(get_current_user)):
    token = body.get("token")
    if token:
        supabase.table("profiles").update({"push_token": token}).eq("id", str(current_user.id)).execute()
    return {"ok": True}


@router.get("/discover")
async def discover(current_user=Depends(get_current_user), limit: int = 20):
    uid = str(current_user.id)

    my_resp = supabase.table("profiles").select("*").eq("id", uid).single().execute()
    my_profile = my_resp.data or {}

    swiped = supabase.table("swipes").select("swiped_id").eq("swiper_id", uid).execute()
    blocked_out = supabase.table("blocks").select("blocked_id").eq("blocker_id", uid).execute()
    blocked_in  = supabase.table("blocks").select("blocker_id").eq("blocked_id", uid).execute()
    exclude = (
        {s["swiped_id"] for s in swiped.data}
        | {b["blocked_id"] for b in blocked_out.data}
        | {b["blocker_id"] for b in blocked_in.data}
        | {uid}
    )

    all_profiles = supabase.table("profiles").select("*").execute()

    candidates = []
    for p in all_profiles.data:
        if p["id"] not in exclude:
            score = compute_compatibility(my_profile, p)
            candidates.append({**p, "compatibility_score": score})

    candidates.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return candidates[:limit]


@router.post("/{user_id}/block")
async def block_user(user_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    try:
        supabase.table("blocks").insert({"blocker_id": uid, "blocked_id": user_id}).execute()
    except Exception:
        pass  # already blocked
    return {"ok": True}


@router.post("/{user_id}/report")
async def report_user(user_id: str, body: dict, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    supabase.table("reports").insert({
        "reporter_id": uid,
        "reported_id": user_id,
        "reason": body.get("reason", "other"),
    }).execute()
    return {"ok": True}


@router.get("/{user_id}")
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return profile.data
