from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.user import User
from app.models.student import Student
from app.utils.security import verify_password

def authenticate_user(db: Session, identifier: str, password_plain: str):
    """
    Authenticates a user by email, username, college email format, or student register number.
    Supports case-insensitive matching, extra whitespace trimming, and lowercase i / uppercase I resolution.
    Verifies password and returns the User object if successful.
    Raises 403 if user is inactive. Returns None if invalid credentials.
    """
    if not identifier:
        return None
        
    login_id = identifier.strip()
    if not login_id:
        return None

    user = None
    match_source = None

    # 1. Step 1: Exact email match in User table (case-insensitive)
    user = db.query(User).filter(func.lower(User.email) == login_id.lower()).first()
    if user:
        match_source = "exact_user_email"

    # 2. Step 2: Username match in User table (case-insensitive)
    if not user:
        user = db.query(User).filter(func.lower(User.username) == login_id.lower()).first()
        if user:
            match_source = "exact_user_username"

    # 3. Step 3: College email format (e.g. 717824i354@kce.ac.in or 717824I354@kce.ac.in)
    if not user and "@" in login_id:
        local_part = login_id.split("@")[0].strip()
        if local_part:
            # Try matching student register_no case-insensitively with local_part
            student = db.query(Student).filter(
                func.lower(Student.register_no) == local_part.lower()
            ).first()
            if student:
                user = db.query(User).filter(User.id == student.user_id).first()
                if not user and student.email:
                    user = db.query(User).filter(func.lower(User.email) == student.email.lower()).first()
                if not user:
                    user = db.query(User).filter(func.lower(User.username) == local_part.lower()).first()
                if user:
                    match_source = "generated_email_student_register_no"

            # If student record wasn't found by register_no, try username match with local_part
            if not user:
                user = db.query(User).filter(func.lower(User.username) == local_part.lower()).first()
                if user:
                    match_source = "generated_email_user_username"

    # 4. Step 4: Direct student register_no match (case-insensitive)
    if not user:
        student = db.query(Student).filter(
            func.lower(Student.register_no) == login_id.lower()
        ).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            if not user and student.email:
                user = db.query(User).filter(func.lower(User.email) == student.email.lower()).first()
            if user:
                match_source = "direct_student_register_no"

    # Safe debug logging (no passwords or hashes logged)
    import os
    if os.environ.get("ENV") != "production":
        print(f"[AUTH_DEBUG] Identifier: '{login_id}' | User Found: {user is not None} | Match Source: {match_source} | Role: {user.role if user else 'None'}")

    if not user:
        return None
        
    if not verify_password(password_plain, user.password_hash):
        if os.environ.get("ENV") != "production":
            print(f"[AUTH_DEBUG] Password verification failed for user_id={user.id}, username={user.username}")
        return None
        
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
        
    return user

def create_user_auth_payload(user: User, db: Session = None):
    """
    Generates a compatible payload dictionary for User authentication.
    Non-student users return student_id/studentId and register_no/registerNo as null.
    """
    student_id = None
    register_no = None
    profile_image = None

    if user.role == "student":
        student = user.student_profile
        if not student and db is not None:
            student = db.query(Student).filter(Student.user_id == user.id).first()
            if not student:
                student = db.query(Student).filter(Student.email == user.email).first()
            if not student:
                student = db.query(Student).filter(func.lower(Student.register_no) == func.lower(user.username)).first()
            if student:
                student.user_id = user.id
                db.add(student)
                db.commit()
                db.refresh(user)
                student = user.student_profile
        if student:
            student_id = student.id
            register_no = student.register_no
            profile_image = student.profile_image or (user.user_profile.profile_image if user.user_profile else None)
    elif user.user_profile and user.user_profile.profile_image:
        profile_image = user.user_profile.profile_image

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "student_id": student_id,
        "studentId": student_id,
        "register_no": register_no,
        "registerNo": register_no,
        "profile_image": profile_image,
        "profileImage": profile_image
    }

# Keep alias for compatibility with other files
generate_user_token_payload = create_user_auth_payload
