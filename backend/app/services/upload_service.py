import io
import openpyxl
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.student import Student
from app.models.score import AssessmentScore
from app.models.user import User
from app.utils.domain_utils import normalize_domain
from app.services.analytics_service import recalculate_student_analytics

from sqlalchemy import func

def process_scores_excel(db: Session, file_bytes: bytes, uploader_id: int, allowed_student_ids: list = None) -> dict:
    """
    Parses and validates scores uploaded via an Excel sheet.
    Inserts valid rows and updates affected students' analytics profiles.
    """
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file format: {str(e)}")

    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))

    if not rows:
        return {
            "success": False,
            "inserted": 0,
            "updated": 0,
            "failed": 0,
            "skipped": 0,
            "analytics_recalculated": False,
            "affected_students": 0,
            "total_rows": 0,
            "valid_rows": 0,
            "error_rows": 0,
            "status": "Failed: The spreadsheet is empty.",
            "errors": [{"row": 1, "message": "Spreadsheet is empty"}]
        }

    # Find headers (look at first row)
    headers = [str(cell).strip().lower().replace("_", " ").replace("  ", " ") if cell is not None else "" for cell in rows[0]]
    
    # Map required columns
    col_mapping = {}
    expected_cols = {
        "register_no": ["register no", "register_no", "reg no", "reg_no", "register number", "reg number"],
        "student_name": ["student name", "student_name", "name", "full name", "full_name"],
        "assessment_name": ["assessment name", "assessment_name", "test name", "assessment", "exam name"],
        "category": ["category", "subject", "domain"],
        "score": ["score", "marks", "marks obtained", "obtained marks"],
        "max_marks": ["max marks", "max_marks", "total marks", "max"],
        "date": ["date", "test date", "assessment date", "assessment_date"]
    }

    for col_key, aliases in expected_cols.items():
        for alias in aliases:
            if alias in headers:
                col_mapping[col_key] = headers.index(alias)
                break

    # Verify all expected columns are found
    missing_cols = [k for k in expected_cols.keys() if k not in col_mapping]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns in Excel: {', '.join(missing_cols)}. Map headers: {list(expected_cols.keys())}"
        )

    errors_list = []
    valid_records = []
    affected_student_ids = set()
    total_data_rows = len(rows) - 1  # Exclude header
    unauthorized_count = 0

    for idx, row in enumerate(rows[1:], start=2):
        # Skip empty rows
        if not any(row):
            continue

        try:
            reg_raw = str(row[col_mapping["register_no"]]).strip() if row[col_mapping["register_no"]] is not None else ""
            if reg_raw.endswith(".0"):
                reg_raw = reg_raw[:-2]
            reg_no = reg_raw.strip()

            student_name = row[col_mapping["student_name"]]
            assessment_name = str(row[col_mapping["assessment_name"]]).strip() if row[col_mapping["assessment_name"]] is not None else ""
            category_raw = str(row[col_mapping["category"]]).strip() if row[col_mapping["category"]] is not None else ""
            score_raw = row[col_mapping["score"]]
            max_marks_raw = row[col_mapping["max_marks"]]
            date_raw = row[col_mapping["date"]]

            # Validate fields presence
            if not reg_no or reg_no == "None":
                errors_list.append({"row": idx, "message": "Register No is missing"})
                continue

            # Validate Category / Domain
            category = normalize_domain(category_raw)
            if not category:
                errors_list.append({
                    "row": idx, 
                    "message": f"Invalid assessment category '{category_raw}'. Must be one of: DSA, DBMS, FullStack, Aptitude, Coding, Academic, Technical"
                })
                continue

            # Validate student existence (case-insensitive register_no lookup)
            student = db.query(Student).filter(func.lower(Student.register_no) == reg_no.lower()).first()
            if not student:
                errors_list.append({"row": idx, "message": f"Student with register number '{reg_no}' not found"})
                continue

            if allowed_student_ids is not None and student.id not in allowed_student_ids:
                unauthorized_count += 1
                errors_list.append({"row": idx, "message": "Student not assigned to this mentor"})
                continue

            # Validate scores
            try:
                score = float(score_raw)
                max_marks = float(max_marks_raw)
            except (ValueError, TypeError):
                errors_list.append({"row": idx, "message": "Score and Max Marks must be numerical values"})
                continue

            if max_marks <= 0:
                errors_list.append({"row": idx, "message": "Max Marks must be greater than zero"})
                continue

            if score < 0 or score > max_marks:
                errors_list.append({"row": idx, "message": f"Score ({score}) cannot be negative or exceed Max Marks ({max_marks})"})
                continue

            # Validate/Parse Date
            parsed_date = None
            if isinstance(date_raw, datetime):
                parsed_date = date_raw
            elif isinstance(date_raw, str):
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y", "%d/%m/%Y"):
                    try:
                        parsed_date = datetime.strptime(date_raw.strip(), fmt)
                        break
                    except ValueError:
                        continue
            
            if not parsed_date:
                parsed_date = datetime.utcnow()  # Fallback to current time if parsing fails

            percentage = round((score / max_marks) * 100.0, 2)

            # Check if uploader user exists
            uploader = db.query(User).filter(User.id == uploader_id).first() if uploader_id else None
            valid_uploader_id = uploader.id if uploader else None

            # Construct database model record
            score_record = AssessmentScore(
                student_id=student.id,
                uploaded_by=valid_uploader_id,
                assessment_name=assessment_name,
                category=category,
                score=score,
                max_marks=max_marks,
                percentage=percentage,
                assessment_date=parsed_date
            )
            
            valid_records.append(score_record)
            affected_student_ids.add(student.id)

        except Exception as err:
            errors_list.append({"row": idx, "message": f"Unexpected parsing error: {str(err)}"})

    # Save valid scores
    if valid_records:
        db.add_all(valid_records)
        db.flush()

        # Trigger recalculation of affected student averages & placement readiness
        for student_id in affected_student_ids:
            recalculate_student_analytics(db, student_id)
        
        db.commit()

    valid_rows = len(valid_records)
    error_rows = len(errors_list)
    
    if error_rows > 0:
        status_msg = f"Import completed with warnings: {error_rows} row(s) skipped."
    else:
        status_msg = "Import completed successfully."

    return {
        "success": True,
        "inserted": valid_rows,
        "updated": 0,
        "failed": error_rows,
        "skipped": error_rows,
        "unauthorized": unauthorized_count,
        "analytics_recalculated": len(affected_student_ids) > 0,
        "affected_students": len(affected_student_ids),
        "total_rows": total_data_rows,
        "valid_rows": valid_rows,
        "error_rows": error_rows,
        "status": status_msg,
        "errors": errors_list
    }
