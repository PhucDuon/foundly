from fastapi import APIRouter, Depends
from app.database import supabase
from app.dependencies import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(current_user=Depends(get_current_user)):
    uid = str(current_user.id)

    result = supabase.rpc("get_user_notifications", {"p_user_id": uid}).execute()
    rows = result.data or []

    # Deduplicate messages: keep only the latest per match_id
    seen_message_matches: set = set()
    deduped = []
    for row in rows:
        if row["type"] == "message":
            mid = row["match_id"]
            if mid in seen_message_matches:
                continue
            seen_message_matches.add(mid)
        deduped.append(row)

    return deduped[:40]
