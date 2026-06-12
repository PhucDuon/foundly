import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.database import supabase
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter()

LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
REDIRECT_URI = "https://foundly-0k7n.onrender.com/auth/linkedin/callback"
APP_DEEP_LINK = "startupmatch://linkedin-callback"


@router.get("/url")
async def get_linkedin_url(current_user=Depends(get_current_user)):
    """Returns the LinkedIn OAuth URL with the user's token embedded in state."""
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=503, detail="LinkedIn not configured.")

    from app.dependencies import security
    # We pass the bearer token as state so the callback can identify the user
    # The token is already validated by get_current_user above
    raise HTTPException(status_code=501, detail="Use /auth/linkedin/start instead.")


@router.get("/start")
async def linkedin_start(token: str):
    """Generates the LinkedIn OAuth URL. token = the user's Bearer token."""
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=503, detail="LinkedIn not configured.")

    import urllib.parse
    url = (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={settings.LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI, safe='')}"
        f"&scope=openid%20profile%20email"
        f"&state={urllib.parse.quote(token, safe='')}"
    )
    return {"url": url}


@router.get("/callback")
async def linkedin_callback(code: str = "", state: str = "", error: str = ""):
    """LinkedIn redirects here after OAuth. Exchanges code, marks user verified, redirects to app."""
    if error or not code or not state:
        return RedirectResponse(f"{APP_DEEP_LINK}?error=cancelled")

    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        return RedirectResponse(f"{APP_DEEP_LINK}?error=not_configured")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                LINKEDIN_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if token_resp.status_code != 200:
                return RedirectResponse(f"{APP_DEEP_LINK}?error=token_exchange_failed")

            access_token = token_resp.json().get("access_token")
            if not access_token:
                return RedirectResponse(f"{APP_DEEP_LINK}?error=no_token")

            userinfo_resp = await client.get(
                LINKEDIN_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                return RedirectResponse(f"{APP_DEEP_LINK}?error=userinfo_failed")

        # Validate the user's app token from state
        from app.dependencies import _auth_client
        user_resp = _auth_client.auth.get_user(state)
        if not user_resp.user:
            return RedirectResponse(f"{APP_DEEP_LINK}?error=invalid_token")

        uid = str(user_resp.user.id)
        supabase.table("profiles").update({"linkedin_verified": True}).eq("id", uid).execute()

        return RedirectResponse(f"{APP_DEEP_LINK}?success=true")

    except Exception:
        return RedirectResponse(f"{APP_DEEP_LINK}?error=server_error")
