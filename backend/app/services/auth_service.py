from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.user import User
from app.models.student import Student
from app.utils.security import verify_password

def authenticate_user(db: Session, identifier: str, password_plain: str):
    """
    Authenticates a user by email, username, or student register number.
    Verifies password and returns the User object if successful.
    Raises 403 if user is inactive. Returns None if invalid credentials.
    """
    if not identifier:
        return None
        
    identifier = identifier.strip()

    # 1. Search by email or username in User table case-insensitively
    user = db.query(User).filter(
        (func.lower(User.email) == identifier.lower()) | 
        (func.lower(User.username) == identifier.lower())
    ).first()
    
    # 2. If not found, check if it's a student's register number case-insensitively
    if not user:
        student = db.query(Student).filter(
            func.lower(Student.register_no) == identifier.lower()
        ).first()
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()

    if not user:
        return None
        
    if not verify_password(password_plain, user.password_hash):
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

    if user.role == "student" and user.student_profile:
        student_id = user.student_profile.id
        register_no = user.student_profile.register_no
        profile_image = user.student_profile.profile_image or (user.user_profile.profile_image if user.user_profile else None)
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
