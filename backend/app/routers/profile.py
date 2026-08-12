from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.profile import UserProfile
from app.utils.file_utils import save_upload_file
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter()

def serialize_profile(user: User, profile: UserProfile, db: Session) -> dict:
    """Helper to convert UserProfile and User relation into compatible ProfileResponse structures."""
    import json
    
    # Extra role details helper
    extra_details = {}
    department = profile.department or ""
    github_url = ""
    linkedin_url = ""
    
    bio_text = profile.bio or ""
    bio_extra = {}
    if bio_text.startswith("{") and bio_text.endswith("}"):
        try:
            bio_data = json.loads(bio_text)
            bio_extra = {
                "assignedDepartment": bio_data.get("assignedDepartment"),
                "assignedYear": bio_data.get("assignedYear"),
                "assignedSection": bio_data.get("assignedSection"),
                "assignedBatch": bio_data.get("assignedBatch"),
                "year": bio_data.get("assignedYear"),
                "section": bio_data.get("assignedSection"),
                "department": bio_data.get("assignedDepartment")
            }
            bio_text = bio_data.get("bio", "")
        except Exception:
            pass
    
    if user.role == "student":
        student = user.student_profile
        if not student:
            from sqlalchemy import func
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
            s = student
            department = s.department
            extra_details = {
                "registerNo": s.register_no,
                "register_no": s.register_no,
                "year": s.year,
                "section": s.section,
                "batch": s.batch,
                "cgpa": s.cgpa,
                "program": "B.Tech " + s.department if s.department else ""
            }
            from app.models.portfolio import PortfolioCustomization
            cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == s.id).first()
            if cust:
                github_url = cust.github_url or ""
                linkedin_url = cust.linkedin_url or ""
    elif user.role == "faculty" and user.faculty_profile:
        f = user.faculty_profile
        department = f.department
        extra_details = {
            "designation": f.designation
        }
    elif user.role == "mentor":
        extra_details = bio_extra

    # Resolve profile image priority: Student.profile_image -> UserProfile.profile_image -> ""
    img_path = ""
    if user.student_profile and user.student_profile.profile_image:
        img_path = user.student_profile.profile_image
    elif profile.profile_image:
        img_path = profile.profile_image

    return {
        "id": user.id,
        "full_name": profile.full_name,
        "fullName": profile.full_name,
        "email": profile.email,
        "phone": profile.phone or "",
        "role": user.role,
        "department": department,
        "location": profile.location or "Coimbatore",
        "avatar_url": img_path,
        "profile_image_url": img_path,
        "image_url": img_path,
        "profile_image": img_path,
        "profileImage": img_path,
        "bio": bio_text,
        "github_url": github_url,
        "githubUrl": github_url,
        "linkedin_url": linkedin_url,
        "linkedinUrl": linkedin_url,
        "extra": extra_details
    }

@router.get("/me/profile", response_model=ProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves detailed profile metadata for the authenticated user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Default creation if profile is missing
        profile = UserProfile(
            user_id=current_user.id,
            full_name=current_user.username,
            email=current_user.email,
            department=""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return serialize_profile(current_user, profile, db)

@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates profile metadata for the authenticated user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.email is not None:
        profile.email = payload.email
        # Sync to user email
        current_user.email = payload.email
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.department is not None:
        profile.department = payload.department
    if payload.location is not None:
        profile.location = payload.location

    if current_user.role != "student" and (payload.bio is not None or payload.year is not None or payload.section is not None or payload.department is not None):
        import json
        existing_bio = profile.bio or ""
        existing_extra = {}
        if existing_bio.startswith("{") and existing_bio.endswith("}"):
            try:
                existing_extra = json.loads(existing_bio)
            except Exception:
                pass
        
        bio_text_val = existing_extra.get("bio", existing_bio)
        
        if payload.bio is not None:
            bio_text_val = payload.bio
        if payload.year is not None:
            existing_extra["assignedYear"] = payload.year
        if payload.section is not None:
            existing_extra["assignedSection"] = payload.section
        if payload.department is not None:
            existing_extra["assignedDepartment"] = payload.department
            
        existing_extra["bio"] = bio_text_val
        profile.bio = json.dumps(existing_extra)
    elif payload.bio is not None:
        profile.bio = payload.bio

    # Sync to Student profile if role is student
    if current_user.role == "student":
        s = current_user.student_profile
        if not s:
            from sqlalchemy import func
            s = db.query(Student).filter(Student.user_id == current_user.id).first()
            if not s:
                s = db.query(Student).filter(Student.email == current_user.email).first()
            if not s:
                s = db.query(Student).filter(func.lower(Student.register_no) == func.lower(current_user.username)).first()
            if s:
                s.user_id = current_user.id
                db.add(s)
                db.commit()
                db.refresh(current_user)
                s = current_user.student_profile

        if s:
            if payload.full_name is not None:
                s.name = payload.full_name
            if payload.email is not None:
                s.email = payload.email
            if payload.phone is not None:
                s.phone = payload.phone
            if payload.department is not None:
                s.department = payload.department
            if payload.year is not None:
                s.year = payload.year
            if payload.section is not None:
                s.section = payload.section

        # Update PortfolioCustomization fields
        from app.models.portfolio import PortfolioCustomization
        cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == s.id).first()
        if not cust:
            cust = PortfolioCustomization(student_id=s.id)
            db.add(cust)
            db.flush()

        # Update customizable attributes (preserving other values)
        if payload.github_url is not None:
            cust.github_url = payload.github_url
        elif payload.githubUrl is not None:
            cust.github_url = payload.githubUrl

        if payload.linkedin_url is not None:
            cust.linkedin_url = payload.linkedin_url
        elif payload.linkedinUrl is not None:
            cust.linkedin_url = payload.linkedinUrl

        if payload.phone is not None:
            cust.phone = payload.phone
        if payload.location is not None:
            cust.location = payload.location
        if payload.email is not None:
            cust.email = payload.email

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return serialize_profile(current_user, profile, db)

@router.post("/me/profile-image")
async def upload_my_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads profile image. If student, synchronizes the URL to the Student table."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id, full_name=current_user.username, email=current_user.email)
        db.add(profile)
        db.flush()

    file_url = await save_upload_file(file, "profile", user_id=current_user.id)
    profile.profile_image = file_url

    # Synchronize to student profile image if role is student
    if current_user.role == "student":
        s = current_user.student_profile
        if not s:
            from sqlalchemy import func
            s = db.query(Student).filter(Student.user_id == current_user.id).first()
            if not s:
                s = db.query(Student).filter(Student.email == current_user.email).first()
            if not s:
                s = db.query(Student).filter(func.lower(Student.register_no) == func.lower(current_user.username)).first()
            if s:
                s.user_id = current_user.id
                db.add(s)
                db.commit()
                db.refresh(current_user)
                s = current_user.student_profile
        if s:
            s.profile_image = file_url

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "avatar_url": file_url,
        "profile_image_url": file_url,
        "image_url": file_url,
        "profile_image": file_url,
        "profileImage": file_url,
        "message": "Profile image updated successfully"
    }
