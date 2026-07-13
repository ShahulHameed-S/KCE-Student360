from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import io
import csv
import openpyxl

from app.dependencies import get_db, RoleRequired
from app.models.user import User
from app.models.student import Student, FacultyProfile, MentorAssignment
from app.models.score import StudentAnalytics
from app.models.profile import UserProfile, StudentAbout
from app.models.portfolio import PortfolioCustomization
from app.utils.security import get_password_hash
from app.services.analytics_service import recalculate_student_analytics

router = APIRouter()

@router.get("/overview")
async def get_admin_overview():
    """Skeleton route for retrieving administrative system overview statistics."""
    return {
        "total_students": 0,
        "total_faculty": 0,
        "total_mentors": 0,
        "total_users": 0,
        "total_scores_uploaded": 0
    }

# Students CRUD
@router.get("/students")
async def admin_get_students():
    return []

@router.post("/students")
async def admin_create_student(payload: Dict[str, Any]):
    return {"success": True}

@router.put("/students/{id}")
async def admin_update_student(id: int, payload: Dict[str, Any]):
    return {"success": True}

@router.delete("/students/{id}")
async def admin_delete_student(id: int):
    return {"success": True}


# Faculty CRUD
@router.get("/faculty")
async def admin_get_faculty(
    current_user: User = Depends(RoleRequired(["admin"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.role == "faculty").all()
    result = []
    for u in users:
        fp = u.faculty_profile
        result.append({
            "id": u.id,
            "name": fp.name if fp else u.user_profile.full_name if u.user_profile else u.username,
            "email": u.email,
            "department": fp.department if fp else u.user_profile.department if u.user_profile else "CSE",
            "role": u.role,
            "phone": fp.phone if fp else u.user_profile.phone if u.user_profile else "",
            "status": "Active" if u.is_active else "Inactive",
            "designation": fp.designation if fp else "Faculty"
        })
    return result

@router.post("/faculty")
async def admin_create_faculty(payload: Dict[str, Any]):
    return {"success": True}

@router.put("/faculty/{id}")
async def admin_update_faculty(id: int, payload: Dict[str, Any]):
    return {"success": True}

@router.delete("/faculty/{id}")
async def admin_delete_faculty(id: int):
    return {"success": True}


# Mentors CRUD
@router.get("/mentors")
async def admin_get_mentors(
    current_user: User = Depends(RoleRequired(["admin"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.role == "mentor").all()
    result = []
    for u in users:
        up = u.user_profile
        fp = u.faculty_profile
        assigned_class = "None"
        assignment = db.query(MentorAssignment).filter(MentorAssignment.mentor_id == u.id).first()
        if assignment and assignment.student:
            s = assignment.student
            assigned_class = f"{s.year} {s.section} ({s.batch})"
            
        result.append({
            "id": u.id,
            "name": up.full_name if up else fp.name if fp else u.username,
            "email": u.email,
            "department": up.department if up else fp.department if fp else "IT",
            "mentorType": "Class Mentor",
            "assignedClass": assigned_class,
            "status": "Active" if u.is_active else "Inactive",
            "phone": up.phone if up else fp.phone if fp else ""
        })
    return result

@router.post("/mentors")
async def admin_create_mentor(payload: Dict[str, Any]):
    return {"success": True}

@router.put("/mentors/{id}")
async def admin_update_mentor(id: int, payload: Dict[str, Any]):
    return {"success": True}

@router.delete("/mentors/{id}")
async def admin_delete_mentor(id: int):
    return {"success": True}


# Users CRUD
@router.get("/users")
async def admin_get_users():
    return []

@router.post("/users")
async def admin_create_user(payload: Dict[str, Any]):
    return {"success": True}

@router.put("/users/{id}")
async def admin_update_user(id: int, payload: Dict[str, Any]):
    return {"success": True}

@router.delete("/users/{id}")
async def admin_delete_user(id: int):
    return {"success": True}


# Mentor Assignments CRUD
@router.get("/mentor-assignments")
async def admin_get_assignments():
    return []

@router.post("/mentor-assignments")
async def admin_create_assignment(payload: Dict[str, Any]):
    return {"success": True}

@router.delete("/mentor-assignments/{id}")
async def admin_delete_assignment(id: int):
    return {"success": True}


# Helper: Parse file to list of rows
def parse_upload_file(file: UploadFile) -> List[List[Any]]:
    contents = file.file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".csv"):
        text_stream = io.StringIO(contents.decode("utf-8", errors="ignore"))
        reader = csv.reader(text_stream)
        return list(reader)
    else:
        try:
            workbook = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
            sheet = workbook.active
            return list(sheet.iter_rows(values_only=True))
        except Exception as e:
            try:
                text_stream = io.StringIO(contents.decode("utf-8", errors="ignore"))
                reader = csv.reader(text_stream)
                return list(reader)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")


# Helper: Map headers
def map_headers(row_header: List[Any], expected_cols: Dict[str, List[str]]) -> Dict[str, int]:
    headers = [str(cell).strip().lower().replace("_", " ").replace("  ", " ") if cell is not None else "" for cell in row_header]
    col_mapping = {}
    for col_key, aliases in expected_cols.items():
        for alias in aliases:
            if alias in headers:
                col_mapping[col_key] = headers.index(alias)
                break
    return col_mapping


# Helper: Clean and generate unique email
def clean_and_generate_email(name: str, suffix_id: str, db: Session) -> str:
    cleaned_name = "".join(c.lower() for c in name if c.isalnum())
    email = f"{cleaned_name}@kce.ac.in"
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        suffix = str(suffix_id).strip().lower()
        if suffix:
            email = f"{cleaned_name}{suffix}@kce.ac.in"
        else:
            count = 2
            while db.query(User).filter(User.email == f"{cleaned_name}{count}@kce.ac.in").first():
                count += 1
            email = f"{cleaned_name}{count}@kce.ac.in"
    return email


# Endpoint: Students Upload
@router.post("/upload/students")
async def upload_students(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleRequired(["admin"])),
    db: Session = Depends(get_db)
):
    rows = parse_upload_file(file)
    if not rows or len(rows) < 2:
        return {
            "success": False,
            "type": "students",
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [{"row": 1, "identifier": "File", "message": "Spreadsheet is empty or missing data rows"}]
        }
        
    expected_cols = {
        "register_no": ["register no", "register_no", "reg no", "reg_no", "register number", "reg number"],
        "name": ["name", "student name", "student_name", "full name", "full_name"],
        "department": ["department", "dept", "branch"],
        "year": ["year", "yr", "class year"],
        "section": ["section", "sec"],
        "email": ["email", "email address", "email_address"],
        "phone": ["phone", "phone no", "phone_no", "phone number", "mobile", "mobile no", "mobile_no"],
        "batch": ["batch", "year of passing", "grad year", "graduation year"],
        "mentor_email": ["mentor_email", "mentor email", "mentor_address", "mentor_email_address"],
        "date_of_birth": ["date_of_birth", "date of birth", "dob"],
        "gender": ["gender", "sex"],
        "address": ["address", "location", "residence"],
        "password": ["password", "default password", "default_password", "pass"]
    }
    
    col_mapping = map_headers(rows[0], expected_cols)
    for req in ["register_no", "name"]:
        if req not in col_mapping:
            raise HTTPException(status_code=400, detail=f"Missing required column: {req}")
            
    inserted = 0
    updated = 0
    skipped = 0
    errors_list = []
    
    hashed_default_password = get_password_hash("Password123!")
    
    for idx, row in enumerate(rows[1:], start=2):
        if not any(row):
            skipped += 1
            continue
            
        try:
            reg_idx = col_mapping["register_no"]
            name_idx = col_mapping["name"]
            
            register_no = str(row[reg_idx]).strip() if (reg_idx < len(row) and row[reg_idx] is not None) else ""
            name = str(row[name_idx]).strip() if (name_idx < len(row) and row[name_idx] is not None) else ""
            
            if not register_no or register_no == "None":
                errors_list.append({"row": idx, "identifier": "Row " + str(idx), "message": "Register number is missing"})
                skipped += 1
                continue
            if not name or name == "None":
                errors_list.append({"row": idx, "identifier": register_no or "Row " + str(idx), "message": "Student name is missing"})
                skipped += 1
                continue
                
            dept_idx = col_mapping.get("department")
            department = str(row[dept_idx]).strip() if (dept_idx is not None and dept_idx < len(row) and row[dept_idx] is not None) else "AI & DS"
            
            year_idx = col_mapping.get("year")
            year = str(row[year_idx]).strip() if (year_idx is not None and year_idx < len(row) and row[year_idx] is not None) else "3"
            
            sec_idx = col_mapping.get("section")
            section = str(row[sec_idx]).strip() if (sec_idx is not None and sec_idx < len(row) and row[sec_idx] is not None) else "A"
            
            phone_idx = col_mapping.get("phone")
            phone = str(row[phone_idx]).strip() if (phone_idx is not None and phone_idx < len(row) and row[phone_idx] is not None) else ""
            
            batch_idx = col_mapping.get("batch")
            batch = str(row[batch_idx]).strip() if (batch_idx is not None and batch_idx < len(row) and row[batch_idx] is not None) else "2028"
            
            email_idx = col_mapping.get("email")
            raw_email = str(row[email_idx]).strip().lower() if (email_idx is not None and email_idx < len(row) and row[email_idx] is not None) else ""
            
            password_idx = col_mapping.get("password")
            custom_password = str(row[password_idx]).strip() if (password_idx is not None and password_idx < len(row) and row[password_idx] is not None) else ""
            
            if custom_password and custom_password != "None":
                hashed_user_password = get_password_hash(custom_password)
            else:
                hashed_user_password = hashed_default_password
            
            with db.begin_nested():
                student = db.query(Student).filter(Student.register_no == register_no).first()
                
                if student:
                    # Update safe fields only
                    student.name = name
                    student.department = department
                    student.year = year
                    student.section = section
                    if phone:
                        student.phone = phone
                    student.batch = batch
                    
                    up = db.query(UserProfile).filter(UserProfile.user_id == student.user_id).first()
                    if up:
                        up.full_name = name
                        if phone:
                            up.phone = phone
                        up.department = department
                        
                    db.flush()
                    updated += 1
                else:
                    email = raw_email
                    if not email:
                        email = clean_and_generate_email(name, register_no, db)
                        
                    user = db.query(User).filter((User.username == register_no) | (User.email == email)).first()
                    if not user:
                        user = User(
                            username=register_no,
                            email=email,
                            password_hash=hashed_user_password,
                            role="student"
                        )
                        db.add(user)
                        db.flush()
                        
                    student = Student(
                        user_id=user.id,
                        register_no=register_no,
                        name=name,
                        email=email,
                        phone=phone,
                        department=department,
                        year=year,
                        section=section,
                        batch=batch
                    )
                    db.add(student)
                    db.flush()
                    
                    up = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                    if not up:
                        up = UserProfile(
                            user_id=user.id,
                            full_name=name,
                            email=email,
                            phone=phone,
                            department=department,
                            location="Coimbatore"
                        )
                        db.add(up)
                        
                    about = db.query(StudentAbout).filter(StudentAbout.student_id == student.id).first()
                    if not about:
                        about = StudentAbout(
                            student_id=student.id,
                            headline="AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer",
                            about_me=f"I am {name}, studying Artificial Intelligence & Data Science at Karpagam College of Engineering.",
                            career_objective="To build a strong career as an AI Engineer and Full Stack Developer.",
                            skills_json='["AI & Data Science", "Java", "React", "Full Stack Development", "Python", "DSA", "DBMS", "FastAPI", "PostgreSQL"]'
                        )
                        db.add(about)
                        
                    cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()
                    if not cust:
                        cust = PortfolioCustomization(
                            student_id=student.id,
                            headline="AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer",
                            about_me=f"I am {name}, studying Artificial Intelligence & Data Science at Karpagam College of Engineering.",
                            career_objective="To build a strong career as an AI Engineer and Full Stack Developer.",
                            skills_json='["AI & Data Science", "Java", "React", "Full Stack Development", "Python", "DSA", "DBMS", "FastAPI", "PostgreSQL"]',
                            theme="Dark Minimal",
                            section_visibility_json='{"showProjects":true,"showCertifications":true,"showAchievements":true,"showAcademicHighlights":true,"showContactLinks":true}',
                            resume_visibility=True
                        )
                        db.add(cust)
                        
                    db.flush()
                    inserted += 1
                
                # Optionally assign mentor if mentor_email is present
                m_email_idx = col_mapping.get("mentor_email")
                mentor_email = str(row[m_email_idx]).strip() if (m_email_idx is not None and m_email_idx < len(row) and row[m_email_idx] is not None) else ""
                if mentor_email:
                    mentor = db.query(User).filter(User.email.ilike(mentor_email), User.role == "mentor").first()
                    if mentor:
                        existing_assign = db.query(MentorAssignment).filter(
                            MentorAssignment.student_id == student.id
                        ).first()
                        if not existing_assign:
                            new_assign = MentorAssignment(mentor_id=mentor.id, student_id=student.id)
                            db.add(new_assign)
                            
                recalculate_student_analytics(db, student.id)
                
            db.commit()
            
        except Exception as e:
            db.rollback()
            errors_list.append({
                "row": idx,
                "identifier": register_no if 'register_no' in locals() and register_no else "Row " + str(idx),
                "message": str(e)
            })
            skipped += 1
            
    return {
        "success": True,
        "type": "students",
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors_list
    }


# Endpoint: Faculty Upload
@router.post("/upload/faculty")
async def upload_faculty(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleRequired(["admin"])),
    db: Session = Depends(get_db)
):
    rows = parse_upload_file(file)
    if not rows or len(rows) < 2:
        return {
            "success": False,
            "type": "faculty",
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [{"row": 1, "identifier": "File", "message": "Spreadsheet is empty or missing data rows"}]
        }
        
    expected_cols = {
        "name": ["name", "faculty name", "faculty_name", "full name", "full_name"],
        "department": ["department", "dept", "branch"],
        "email": ["email", "email address", "email_address"],
        "phone": ["phone", "phone no", "phone_no", "phone number", "mobile", "mobile no", "mobile_no"],
        "designation": ["designation", "role", "title", "position"],
        "employee_id": ["employee_id", "employee id", "emp id", "emp_id", "faculty id", "faculty_id"],
        "password": ["password", "default password", "default_password", "pass"]
    }
    
    col_mapping = map_headers(rows[0], expected_cols)
    if "name" not in col_mapping:
        raise HTTPException(status_code=400, detail="Missing required column: name")
        
    inserted = 0
    updated = 0
    skipped = 0
    errors_list = []
    
    hashed_default_password = get_password_hash("Password123!")
    
    for idx, row in enumerate(rows[1:], start=2):
        if not any(row):
            skipped += 1
            continue
            
        try:
            name_idx = col_mapping["name"]
            name = str(row[name_idx]).strip() if (name_idx < len(row) and row[name_idx] is not None) else ""
            if not name or name == "None":
                errors_list.append({"row": idx, "identifier": "Row " + str(idx), "message": "Faculty name is missing"})
                skipped += 1
                continue
                
            email_idx = col_mapping.get("email")
            email = str(row[email_idx]).strip().lower() if (email_idx is not None and email_idx < len(row) and row[email_idx] is not None) else ""
            
            emp_id_idx = col_mapping.get("employee_id")
            emp_id = str(row[emp_id_idx]).strip() if (emp_id_idx is not None and emp_id_idx < len(row) and row[emp_id_idx] is not None) else ""
            
            if not email:
                email = clean_and_generate_email(name, emp_id, db)
                
            dept_idx = col_mapping.get("department")
            department = str(row[dept_idx]).strip() if (dept_idx is not None and dept_idx < len(row) and row[dept_idx] is not None) else "AI & DS"
            
            phone_idx = col_mapping.get("phone")
            phone = str(row[phone_idx]).strip() if (phone_idx is not None and phone_idx < len(row) and row[phone_idx] is not None) else ""
            
            desig_idx = col_mapping.get("designation")
            designation = str(row[desig_idx]).strip() if (desig_idx is not None and desig_idx < len(row) and row[desig_idx] is not None) else "Assistant Professor"

            password_idx = col_mapping.get("password")
            custom_password = str(row[password_idx]).strip() if (password_idx is not None and password_idx < len(row) and row[password_idx] is not None) else ""
            
            if custom_password and custom_password != "None":
                hashed_user_password = get_password_hash(custom_password)
            else:
                hashed_user_password = hashed_default_password
            
            with db.begin_nested():
                user = db.query(User).filter(User.email == email).first()
                if user:
                    user.is_active = True
                    up = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                    if up:
                        up.full_name = name
                        up.phone = phone
                        up.department = department
                    else:
                        up = UserProfile(user_id=user.id, full_name=name, email=email, phone=phone, department=department)
                        db.add(up)
                        
                    fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
                    if fp:
                        fp.name = name
                        fp.phone = phone
                        fp.department = department
                        fp.designation = designation
                    else:
                        fp = FacultyProfile(user_id=user.id, name=name, email=email, phone=phone, department=department, designation=designation)
                        db.add(fp)
                    db.flush()
                    updated += 1
                else:
                    user = User(
                        username=email,
                        email=email,
                        password_hash=hashed_user_password,
                        role="faculty"
                    )
                    db.add(user)
                    db.flush()
                    
                    up = UserProfile(
                        user_id=user.id,
                        full_name=name,
                        email=email,
                        phone=phone,
                        department=department,
                        location="Coimbatore"
                    )
                    db.add(up)
                    
                    fp = FacultyProfile(
                        user_id=user.id,
                        name=name,
                        email=email,
                        phone=phone,
                        department=department,
                        designation=designation
                    )
                    db.add(fp)
                    db.flush()
                    inserted += 1
                    
            db.commit()
            
        except Exception as e:
            db.rollback()
            errors_list.append({
                "row": idx,
                "identifier": email if 'email' in locals() and email else "Row " + str(idx),
                "message": str(e)
            })
            skipped += 1
            
    return {
        "success": True,
        "type": "faculty",
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors_list
    }


# Endpoint: Mentors Upload
@router.post("/upload/mentors")
async def upload_mentors(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleRequired(["admin"])),
    db: Session = Depends(get_db)
):
    rows = parse_upload_file(file)
    if not rows or len(rows) < 2:
        return {
            "success": False,
            "type": "mentors",
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [{"row": 1, "identifier": "File", "message": "Spreadsheet is empty or missing data rows"}]
        }
        
    expected_cols = {
        "name": ["name", "mentor name", "mentor_name", "full name", "full_name"],
        "department": ["department", "dept", "branch"],
        "email": ["email", "email address", "email_address"],
        "phone": ["phone", "phone no", "phone_no", "phone number", "mobile", "mobile no", "mobile_no"],
        "designation": ["designation", "role", "title", "position"],
        "employee_id": ["employee_id", "employee id", "emp id", "emp_id", "mentor id", "mentor_id"],
        "assigned_section": ["assigned_section", "assigned section", "section", "sec"],
        "assigned_batch": ["assigned_batch", "assigned batch", "batch", "class batch"],
        "password": ["password", "default password", "default_password", "pass"]
    }
    
    col_mapping = map_headers(rows[0], expected_cols)
    if "name" not in col_mapping:
        raise HTTPException(status_code=400, detail="Missing required column: name")
        
    inserted = 0
    updated = 0
    skipped = 0
    errors_list = []
    
    hashed_default_password = get_password_hash("Password123!")
    
    for idx, row in enumerate(rows[1:], start=2):
        if not any(row):
            skipped += 1
            continue
            
        try:
            name_idx = col_mapping["name"]
            name = str(row[name_idx]).strip() if (name_idx < len(row) and row[name_idx] is not None) else ""
            if not name or name == "None":
                errors_list.append({"row": idx, "identifier": "Row " + str(idx), "message": "Mentor name is missing"})
                skipped += 1
                continue
                
            email_idx = col_mapping.get("email")
            email = str(row[email_idx]).strip().lower() if (email_idx is not None and email_idx < len(row) and row[email_idx] is not None) else ""
            
            emp_id_idx = col_mapping.get("employee_id")
            emp_id = str(row[emp_id_idx]).strip() if (emp_id_idx is not None and emp_id_idx < len(row) and row[emp_id_idx] is not None) else ""
            
            if not email:
                email = clean_and_generate_email(name, emp_id, db)
                
            dept_idx = col_mapping.get("department")
            department = str(row[dept_idx]).strip() if (dept_idx is not None and dept_idx < len(row) and row[dept_idx] is not None) else "AI & DS"
            
            phone_idx = col_mapping.get("phone")
            phone = str(row[phone_idx]).strip() if (phone_idx is not None and phone_idx < len(row) and row[phone_idx] is not None) else ""
            
            desig_idx = col_mapping.get("designation")
            designation = str(row[desig_idx]).strip() if (desig_idx is not None and desig_idx < len(row) and row[desig_idx] is not None) else "Mentor"

            password_idx = col_mapping.get("password")
            custom_password = str(row[password_idx]).strip() if (password_idx is not None and password_idx < len(row) and row[password_idx] is not None) else ""
            
            if custom_password and custom_password != "None":
                hashed_user_password = get_password_hash(custom_password)
            else:
                hashed_user_password = hashed_default_password
            
            with db.begin_nested():
                user = db.query(User).filter(User.email == email).first()
                if user:
                    user.is_active = True
                    up = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                    if up:
                        up.full_name = name
                        up.phone = phone
                        up.department = department
                    else:
                        up = UserProfile(user_id=user.id, full_name=name, email=email, phone=phone, department=department)
                        db.add(up)
                        
                    fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
                    if fp:
                        fp.name = name
                        fp.phone = phone
                        fp.department = department
                        fp.designation = designation
                    else:
                        fp = FacultyProfile(user_id=user.id, name=name, email=email, phone=phone, department=department, designation=designation)
                        db.add(fp)
                        
                    db.flush()
                    updated += 1
                else:
                    user = User(
                        username=email,
                        email=email,
                        password_hash=hashed_user_password,
                        role="mentor"
                    )
                    db.add(user)
                    db.flush()
                    
                    up = UserProfile(
                        user_id=user.id,
                        full_name=name,
                        email=email,
                        phone=phone,
                        department=department,
                        location="Coimbatore"
                    )
                    db.add(up)
                    
                    fp = FacultyProfile(
                        user_id=user.id,
                        name=name,
                        email=email,
                        phone=phone,
                        department=department,
                        designation=designation
                    )
                    db.add(fp)
                    db.flush()
                    inserted += 1
                
                sec_idx = col_mapping.get("assigned_section")
                batch_idx = col_mapping.get("assigned_batch")
                
                assigned_sec = str(row[sec_idx]).strip() if (sec_idx is not None and sec_idx < len(row) and row[sec_idx] is not None) else ""
                assigned_bat = str(row[batch_idx]).strip() if (batch_idx is not None and batch_idx < len(row) and row[batch_idx] is not None) else ""
                
                if assigned_sec and assigned_bat:
                    students = db.query(Student).filter(
                        Student.department.ilike(department),
                        Student.section.ilike(assigned_sec),
                        Student.batch.ilike(assigned_bat)
                    ).all()
                    
                    for s in students:
                        existing_assign = db.query(MentorAssignment).filter(
                            MentorAssignment.mentor_id == user.id,
                            MentorAssignment.student_id == s.id
                        ).first()
                        if not existing_assign:
                            new_assign = MentorAssignment(mentor_id=user.id, student_id=s.id)
                            db.add(new_assign)
                            
            db.commit()
            
        except Exception as e:
            db.rollback()
            errors_list.append({
                "row": idx,
                "identifier": email if 'email' in locals() and email else "Row " + str(idx),
                "message": str(e)
            })
            skipped += 1
            
    return {
        "success": True,
        "type": "mentors",
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors_list
    }
