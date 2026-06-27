import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.message import MessageCreate
from app.services.notifications import get_profile_name, push_to_user

router = APIRouter()


def _assert_match_member(match_id: str, uid: str) -> dict:
    result = supabase.rpc("get_match_members", {"p_match_id": match_id}).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Match not found.")
    match = result.data[0]
    if uid not in (match["user1_id"], match["user2_id"]):
        raise HTTPException(status_code=403, detail="Not your match.")
    return match


@router.get("/{match_id}")
async def get_messages(match_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    _assert_match_member(match_id, uid)

    supabase.rpc("mark_messages_read", {"p_match_id": match_id, "p_reader_id": uid}).execute()
    result = supabase.rpc("get_messages_for_match", {"p_match_id": match_id}).execute()
    return result.data or []


@router.post("/{match_id}")
async def send_message(match_id: str, data: MessageCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    match = _assert_match_member(match_id, uid)

    if not data.content.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    message = supabase.rpc("insert_message", {
        "p_match_id": match_id,
        "p_sender_id": uid,
        "p_content": data.content.strip(),
    }).execute()

    # Notify the recipient
    recipient_id = match["user2_id"] if match["user1_id"] == uid else match["user1_id"]
    sender_name = await get_profile_name(uid)
    await push_to_user(
        recipient_id,
        f"💬 {sender_name}",
        data.content.strip()[:100],
        {"type": "message", "match_id": match_id},
    )

    return message.data[0]


@router.patch("/{match_id}/read")
async def mark_read(match_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    _assert_match_member(match_id, uid)
    supabase.rpc("mark_messages_read", {"p_match_id": match_id, "p_reader_id": uid}).execute()
    return {"ok": True}


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    ext = (file.filename or "photo.jpg").rsplit(".", 1)[-1]
    path = f"{uid}/{int(time.time())}.{ext}"
    content = await file.read()

    supabase.storage.from_("chat-images").upload(
        path=path,
        file=content,
        file_options={"content-type": file.content_type or "image/jpeg", "upsert": "true"},
    )

    url = supabase.storage.from_("chat-images").get_public_url(path)
    return {"url": url}
