from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserAuthResponse, RefreshTokenRequest
from app.services.auth_service import authenticate_user, create_user_auth_payload
from app.utils.security import create_access_token, create_refresh_token, decode_token
from app.utils.response_utils import error_response

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates the user and returns access/refresh JWT tokens."""
    import time
    start = time.time()
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "AUTH_INVALID_CREDENTIALS",
                    "message": "Invalid email/register number or password",
                    "details": None
                }
            }
        )

    # Encode details into token data payload
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    user_payload = create_user_auth_payload(user, db)

    duration = time.time() - start
    print(f"[TIMING] POST /auth/login took {duration:.4f} seconds.")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me", response_model=UserAuthResponse)
async def get_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Retrieves metadata of the currently authenticated active user."""
    import time
    start = time.time()
    res = create_user_auth_payload(current_user, db)
    duration = time.time() - start
    print(f"[TIMING] GET /auth/me took {duration:.4f} seconds.")
    return res

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Validates the refresh token and returns a new pair of access and refresh tokens."""
    try:
        token_data = decode_token(payload.refresh_token)
        # Verify token type is refresh
        if token_data.get("type") != "refresh":
            raise Exception()
            
        user_id = token_data.get("sub")
        if not user_id:
            raise Exception()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "AUTH_INVALID_TOKEN",
                    "message": "Invalid or expired token",
                    "details": None
                }
            }
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "AUTH_INVALID_TOKEN",
                    "message": "Invalid or expired token",
                    "details": None
                }
            }
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "AUTH_INACTIVE_USER",
                    "message": "User account is inactive",
                    "details": None
                }
            }
        )

    new_token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }

    access_token = create_access_token(data=new_token_data)
    refresh_token = create_refresh_token(data=new_token_data)
    user_payload = create_user_auth_payload(user, db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.post("/logout")
async def logout():
    """Logs out the user (stateless JWT deletion occurs client-side)."""
    return {
        "success": True,
        "message": "Logged out successfully"
    }
