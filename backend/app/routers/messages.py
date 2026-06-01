import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.message import MessageCreate
from app.services.notifications import send_push

router = APIRouter()


def _assert_match_member(match_id: str, uid: str) -> dict:
    match = supabase.table("matches").select("user1_id, user2_id").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found.")
    if uid not in (match.data["user1_id"], match.data["user2_id"]):
        raise HTTPException(status_code=403, detail="Not your match.")
    return match.data


@router.get("/{match_id}")
async def get_messages(match_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    _assert_match_member(match_id, uid)
    messages = (
        supabase.table("messages")
        .select("*")
        .eq("match_id", match_id)
        .order("sent_at")
        .execute()
    )
    return messages.data


@router.post("/{match_id}")
async def send_message(match_id: str, data: MessageCreate, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    match = _assert_match_member(match_id, uid)

    if not data.content.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    message = supabase.table("messages").insert({
        "match_id": match_id,
        "sender_id": uid,
        "content": data.content.strip(),
    }).execute()

    # Notify the recipient
    recipient_id = match["user2_id"] if match["user1_id"] == uid else match["user1_id"]
    sender = supabase.table("profiles").select("name").eq("id", uid).single().execute()
    recipient = supabase.table("profiles").select("push_token").eq("id", recipient_id).single().execute()
    sender_name = sender.data["name"] if sender.data else "Someone"

    await send_push(
        recipient.data.get("push_token") if recipient.data else None,
        f"💬 {sender_name}",
        data.content.strip()[:100],
        {"type": "message", "match_id": match_id},
    )

    return message.data[0]


@router.patch("/{match_id}/read")
async def mark_read(match_id: str, current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    _assert_match_member(match_id, uid)
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("messages").update({"read_at": now}).eq("match_id", match_id).neq("sender_id", uid).is_("read_at", "null").execute()
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
