from fastapi import APIRouter, HTTPException, Depends
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.user import UserRegister, UserLogin, AuthResponse
from app.utils import role_to_emoji

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(data: UserRegister):
    try:
        auth_resp = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = auth_resp.user
    session = auth_resp.session
    if not user or not session:
        raise HTTPException(status_code=400, detail="Registration failed — check your email for confirmation.")

    profile_data = {
        "id": str(user.id),
        "name": data.name,
        "email": data.email,
        "role": data.role,
        "experience_level": data.experience_level,
        "bio": "",
        "location": "",
        "skills": data.skills,
        "interests": data.interests,
        "emoji": role_to_emoji(data.role),
    }

    try:
        profile = supabase.table("profiles").insert(profile_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Profile creation failed: {e}")

    return {
        "access_token": session.access_token,
        "token_type": "bearer",
        "user": profile.data[0],
    }


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    try:
        auth_resp = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = auth_resp.user
    session = auth_resp.session

    profile = supabase.table("profiles").select("*").eq("id", str(user.id)).single().execute()

    return {
        "access_token": session.access_token,
        "token_type": "bearer",
        "user": profile.data,
    }


@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    supabase.auth.sign_out()
    return {"message": "Logged out successfully."}


@router.delete("/me")
async def delete_account(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    supabase.table("profiles").delete().eq("id", uid).execute()
    try:
        supabase.auth.admin.delete_user(uid)
    except Exception:
        pass
    return {"message": "Account deleted."}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    profile = supabase.table("profiles").select("*").eq("id", uid).single().execute()

    if not profile.data:
        # Auto-create profile for OAuth users (Google, etc.)
        meta = current_user.user_metadata or {}
        name = meta.get("full_name") or meta.get("name") or (current_user.email or "").split("@")[0] or "User"
        new_profile = {
            "id": uid,
            "name": name,
            "email": current_user.email or "",
            "role": "Other",
            "experience_level": "Beginner",
            "bio": "",
            "location": "",
            "skills": [],
            "interests": [],
            "emoji": "🚀",
            "avatar_url": meta.get("avatar_url") or meta.get("picture"),
        }
        result = supabase.table("profiles").insert(new_profile).execute()
        return result.data[0]

    return profile.data
