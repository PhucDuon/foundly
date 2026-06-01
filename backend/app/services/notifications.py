import httpx

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
