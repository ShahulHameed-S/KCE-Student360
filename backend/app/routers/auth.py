from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserAuthResponse, RefreshTokenRequest, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest
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

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 1 of forgot password. Looks up user by register no or email.
    Generates OTP, hashes it, saves to DB, sends OTP email, and logs action.
    """
    import random
    from datetime import datetime, timedelta
    from app.models.otp_models import PasswordResetOTP, PasswordResetLog
    from app.models.student import Student
    from app.services.email_service import send_otp_email
    from app.utils.security import get_password_hash
    from sqlalchemy import func

    identifier = payload.email_or_register_no.strip()
    if not identifier:
        raise HTTPException(status_code=404, detail="No account found for this register number or email.")

    if "@" in identifier:
        local_part = identifier.split("@")[0].strip()
    else:
        local_part = identifier

    user = None
    
    # 1. users.email == identifier case-insensitive
    user = db.query(User).filter(func.lower(User.email) == identifier.lower()).first()
    
    # 2. users.username == identifier case-insensitive
    if not user:
        user = db.query(User).filter(func.lower(User.username) == identifier.lower()).first()
        
    # 3. students.register_no == identifier case-insensitive
    if not user:
        student = db.query(Student).filter(func.lower(Student.register_no) == identifier.lower()).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            
    # 4. students.register_no == local_part case-insensitive
    if not user and local_part:
        student = db.query(Student).filter(func.lower(Student.register_no) == local_part.lower()).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()

    if not user:
        # Log failure securely
        log = PasswordResetLog(
            user_id=None,
            email=identifier,
            action="otp_request",
            status="failure",
            message=f"User not found for forgot-password identifier: {identifier}"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=404, detail="No account found for this register number or email.")

    # Resolve email target based on user role
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student and student.register_no:
            email_to_use = f"{student.register_no.strip().replace(' ', '')}@kce.ac.in"
        else:
            email_to_use = f"{user.username.strip().replace(' ', '')}@kce.ac.in"
    else:
        email_to_use = user.email.strip() if user.email else None

    if not email_to_use:
        # Log failure securely (no email found)
        log = PasswordResetLog(
            user_id=user.id,
            email=None,
            register_no=user.username if user.role == "student" else None,
            role=user.role,
            action="otp_request",
            status="failure",
            message="No registered email address exists for this user account"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=404, detail="No account found for this register number or email.")

    # Generate 6-digit random OTP
    otp = f"{random.randint(100000, 999999)}"
    otp_hash = get_password_hash(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Send plain text OTP via email service (will handle fallback in development)
    try:
        send_otp_email(email_to_use, otp, role=user.role)
    except Exception as e:
        err_msg = str(e)
        print(f"[ERROR] Failed to send email to {email_to_use}: {err_msg}")
        
        # Log failure audit record securely
        try:
            log = PasswordResetLog(
                user_id=user.id,
                email=email_to_use,
                register_no=user.username if user.role == "student" else None,
                role=user.role,
                action="otp_request",
                status="failure",
                message=f"Email delivery failed: {err_msg}"
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
            
        detail_msg = "Unable to send OTP email. Please contact admin."
        if "not configured" in err_msg.lower():
            detail_msg = "Email service is not configured."
        elif "authentication failed" in err_msg.lower() or "status code 401" in err_msg.lower() or "status code 403" in err_msg.lower():
            detail_msg = "Email service authentication failed. Please contact admin."
        elif "timed out" in err_msg.lower() or "timeouterror" in err_msg.lower():
            detail_msg = "Email service timed out. Please try again later."
        raise HTTPException(status_code=500, detail=detail_msg)

    # Deactivate previous active OTPs for safety
    try:
        db.query(PasswordResetOTP).filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.is_used == False
        ).update({"is_used": True})

        # Save OTP to database
        db_otp = PasswordResetOTP(
            user_id=user.id,
            email=email_to_use,
            otp_hash=otp_hash,
            expires_at=expires_at,
            is_used=False,
            attempts=0
        )
        db.add(db_otp)

        # Log action
        log = PasswordResetLog(
            user_id=user.id,
            email=email_to_use,
            register_no=user.username if user.role == "student" else None,
            role=user.role,
            action="otp_request",
            status="success",
            message="OTP generated and reset email sent successfully"
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save OTP session. Please try again.")

    def mask_email(email_str: str, role: str) -> str:
        if not email_str or "@" not in email_str:
            return email_str
        local, domain = email_str.split("@", 1)
        if role == "student":
            if len(local) > 3:
                return f"{local[:-3]}***@{domain}"
            return f"{local}***@{domain}"
        else:
            if len(local) > 3:
                return f"{local[:2]}***{local[-1]}@{domain}"
            return f"{local[0]}***@{domain}"

    import os
    from app.config import settings
    demo_email = os.environ.get("DEMO_OTP_EMAIL") or getattr(settings, "DEMO_OTP_EMAIL", None)
    if demo_email:
        return {
            "success": True,
            "message": "OTP sent to verified demo email for testing."
        }

    masked_email = mask_email(email_to_use, user.role)

    return {
        "success": True,
        "message": f"OTP sent to {masked_email}"
    }

@router.post("/verify-reset-otp")
async def verify_reset_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Step 2 of forgot password. Verifies 6-digit OTP, increments attempts on failure,
    and returns a short-lived reset token with purpose claim.
    """
    from datetime import datetime, timedelta
    from app.models.otp_models import PasswordResetOTP, PasswordResetLog
    from app.models.student import Student
    from app.utils.security import verify_password
    from sqlalchemy import func
    from jose import jwt
    from app.config import settings

    identifier = payload.email_or_register_no.strip()
    otp = payload.otp.strip()

    if not identifier or not otp:
        raise HTTPException(status_code=400, detail="Identifier and OTP are required")

    if "@" in identifier:
        local_part = identifier.split("@")[0].strip()
    else:
        local_part = identifier

    user = None
    
    # 1. users.email == identifier case-insensitive
    user = db.query(User).filter(func.lower(User.email) == identifier.lower()).first()
    
    # 2. users.username == identifier case-insensitive
    if not user:
        user = db.query(User).filter(func.lower(User.username) == identifier.lower()).first()
        
    # 3. students.register_no == identifier case-insensitive
    if not user:
        student = db.query(Student).filter(func.lower(Student.register_no) == identifier.lower()).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            
    # 4. students.register_no == local_part case-insensitive
    if not user and local_part:
        student = db.query(Student).filter(func.lower(Student.register_no) == local_part.lower()).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found for this register number or email.")

    # Find the active OTP for this user
    db_otp = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used == False,
        PasswordResetOTP.expires_at > datetime.utcnow()
    ).order_by(PasswordResetOTP.created_at.desc()).first()

    if not db_otp:
        log = PasswordResetLog(
            user_id=user.id,
            email=user.email,
            register_no=user.username if user.role == "student" else None,
            role=user.role,
            action="otp_verified",
            status="failure",
            message="No active OTP found or OTP expired"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired")

    # Limit attempts
    if db_otp.attempts >= 5:
        db_otp.is_used = True
        db.commit()
        log = PasswordResetLog(
            user_id=user.id,
            email=user.email,
            register_no=user.username if user.role == "student" else None,
            role=user.role,
            action="otp_verified",
            status="failure",
            message="OTP locked due to too many failed attempts"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")

    # Verify the plain text OTP against stored OTP hash
    if not verify_password(otp, db_otp.otp_hash):
        db_otp.attempts += 1
        if db_otp.attempts >= 5:
            db_otp.is_used = True
        
        log = PasswordResetLog(
            user_id=user.id,
            email=user.email,
            register_no=user.username if user.role == "student" else None,
            role=user.role,
            action="otp_verified",
            status="failure",
            message=f"Incorrect OTP entered. Attempt {db_otp.attempts}"
        )
        db.add(log)
        db.commit()
        
        if db_otp.attempts >= 5:
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Generate a secure short-lived reset token with specific purpose claim
    expire = datetime.utcnow() + timedelta(minutes=15)
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "purpose": "password_reset",
        "type": "reset",
        "exp": expire
    }
    reset_token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    log = PasswordResetLog(
        user_id=user.id,
        email=user.email,
        register_no=user.username if user.role == "student" else None,
        role=user.role,
        action="otp_verified",
        status="success",
        message="OTP verified successfully. Temporary reset token issued."
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "reset_token": reset_token
    }

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 3 of forgot password. Validates reset token, ensures purpose matches,
    updates user password hash, and marks database OTP as used.
    """
    from datetime import datetime
    from app.models.otp_models import PasswordResetOTP, PasswordResetLog
    from app.utils.security import get_password_hash, decode_token
    from jose import JWTError

    try:
        token_data = decode_token(payload.reset_token)
        
        if token_data.get("purpose") != "password_reset":
            raise JWTError("Invalid token purpose")
            
        user_id = token_data.get("sub")
        if not user_id:
            raise JWTError("Sub missing")
            
    except JWTError as e:
        log = PasswordResetLog(
            user_id=None,
            action="otp_password_reset_failure",
            status="failure",
            message=f"JWT verification failed: {str(e)}"
        )
        db.add(log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is invalid or expired"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        log = PasswordResetLog(
            user_id=int(user_id),
            action="otp_password_reset_failure",
            status="failure",
            message="User associated with token not found"
        )
        db.add(log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    # Hash new password
    hashed_password = get_password_hash(payload.new_password)
    user.password_hash = hashed_password
    
    # Mark user's active OTP as used
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used == False
    ).update({
        "is_used": True,
        "used_at": datetime.utcnow()
    })
    
    log = PasswordResetLog(
        user_id=user.id,
        email=user.email,
        register_no=user.username if user.role == "student" else None,
        role=user.role,
        action="otp_password_reset_success",
        status="success",
        message="Password reset successful. Account access restored."
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Password updated successfully."
    }
