import httpx
from app.database import supabase

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(token: str | None, title: str, body: str, data: dict | None = None):
    if not token or not token.startswith("ExponentPushToken"):
        return
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(EXPO_PUSH_URL, json={
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "data": data or {},
            })
    except Exception as e:
        print(f"[push] failed: {e}")


async def get_profile_name(uid: str) -> str:
    resp = supabase.table("profiles").select("name").eq("id", uid).single().execute()
    return resp.data["name"] if resp.data else "Someone"


async def push_to_user(recipient_id: str, title: str, body: str, data: dict | None = None):
    resp = supabase.table("profiles").select("push_token").eq("id", recipient_id).single().execute()
    if resp.data and resp.data.get("push_token"):
        await send_push(resp.data["push_token"], title, body, data)
