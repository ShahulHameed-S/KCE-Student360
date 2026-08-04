import json
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.profile import StudentAbout, UserProfile
from app.models.resume import Resume
from app.models.score import StudentAnalytics, AssessmentScore
from app.models.submission import StudentProject, StudentCertification, StudentAchievement
from app.models.portfolio import PortfolioCustomization
from app.models.ai_summary import AISummary

DEFAULT_HEADLINE = "AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer"
DEFAULT_ABOUT_ME = (
    "I am Shahul, an Artificial Intelligence and Data Science student at Karpagam College of Engineering. "
    "I am passionate about building useful software solutions that combine AI, full stack development, "
    "and real-world problem solving."
)
DEFAULT_CAREER_OBJ = (
    "To build a strong career as an AI Engineer and Java Full Stack Developer by using my knowledge in "
    "Artificial Intelligence, Data Science, and software development to create innovative, practical, "
    "and impactful solutions."
)
DEFAULT_SKILLS = [
    "AI & Data Science", "Java", "React", "Full Stack Development", 
    "Python", "DSA", "DBMS", "FastAPI", "PostgreSQL"
]

def to_dict(obj):
    if not obj:
        return {}
    d = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, (date, datetime)):
            d[col.name] = val.isoformat()
        else:
            d[col.name] = val
    return d

def get_public_portfolio(db: Session, register_no: str) -> dict:
    """
    Aggregates all profile, submissions, performance averages, resume details,
    customization configurations, and AI analytics for a public student portfolio.
    """
    student = db.query(Student).filter(Student.register_no == register_no).first()
    if not student:
        return None

    # Fetch all raw profile records
    analytics_obj = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student.id).first()
    about_obj = db.query(StudentAbout).filter(StudentAbout.student_id == student.id).first()
    resume_obj = db.query(Resume).filter(Resume.student_id == student.id).first()
    custom_obj = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()
    ai_sum_obj = db.query(AISummary).filter(AISummary.student_id == student.id).first()

    # Safe debug in development logging
    import os
    if os.environ.get("ENV") == "development" or os.environ.get("APP_ENV") == "development" or os.environ.get("ENVIRONMENT") == "development":
        has_cust = custom_obj is not None
        cust_student_id = custom_obj.student_id if has_cust else "None"
        cgpa_in_json = "None"
        if has_cust and custom_obj.section_visibility_json:
            try:
                js = json.loads(custom_obj.section_visibility_json)
                cgpa_in_json = js.get("hero", {}).get("cgpa", "None") if isinstance(js, dict) else "None"
            except Exception:
                pass
        print(f"[DEBUG_PUBLIC_PORTFOLIO] identifier: {register_no} | student.id: {student.id} | student.register_no: {student.register_no} | student.user_id: {student.user_id} | customization_exists: {has_cust} | cust.student_id: {cust_student_id} | cgpa_in_json: {cgpa_in_json}")

    # Submissions (Filter out rejected items, include pending clearly marked or approved verified)
    projects = db.query(StudentProject).filter(
        StudentProject.student_id == student.id,
        StudentProject.status != "Rejected"
    ).all()
    
    certifications = db.query(StudentCertification).filter(
        StudentCertification.student_id == student.id,
        StudentCertification.status != "Rejected"
    ).all()

    achievements = db.query(StudentAchievement).filter(
        StudentAchievement.student_id == student.id,
        StudentAchievement.status != "Rejected"
    ).all()

    scores = db.query(AssessmentScore).filter(
        AssessmentScore.student_id == student.id
    ).order_by(AssessmentScore.assessment_date.desc()).all()

    # 1. Resolve profile image priority: Student.profile_image -> UserProfile.profile_image -> None fallback
    profile_image = student.profile_image
    if not profile_image:
        user_prof = db.query(UserProfile).filter(UserProfile.user_id == student.user_id).first()
        if user_prof:
            profile_image = user_prof.profile_image
            
    # 2. Parse Customization JSON & Set Priorities
    custom_data = {}
    if custom_obj and custom_obj.section_visibility_json:
        try:
            custom_data = json.loads(custom_obj.section_visibility_json)
        except Exception:
            pass
    if not isinstance(custom_data, dict):
        custom_data = {}

    hero_data = custom_data.get("hero", {})
    skills_data = custom_data.get("skills", {})
    links_data = custom_data.get("links", {})
    sections_data = custom_data.get("sections", {})
    music_data = custom_data.get("music", {})

    # Display Name
    custom_name = hero_data.get("displayName")
    display_name = custom_name if (custom_name and custom_name.strip()) else (student.name or "Student")

    # Welcome Text
    welcome_text = hero_data.get("welcomeText") or "WELCOME TO MY PORTFOLIO"

    # Avatar Initials
    avatar_initials = hero_data.get("avatarInitials")
    if not avatar_initials or not avatar_initials.strip():
        avatar_initials = "".join([n[0] for n in display_name.split() if n]).upper()[:2] if display_name else "ST"

    # Headline
    headline = None
    custom_headline = hero_data.get("headline")
    if custom_headline and custom_headline.strip():
        headline = custom_headline
    elif custom_obj and custom_obj.headline:
        headline = custom_obj.headline
    elif resume_obj and (resume_obj.preferred_role or resume_obj.resume_title):
        headline = resume_obj.preferred_role or resume_obj.resume_title
    elif about_obj and about_obj.headline:
        headline = about_obj.headline
    else:
        headline = DEFAULT_HEADLINE

    # About Me / Intro
    about_me = None
    custom_intro = hero_data.get("intro")
    if custom_intro and custom_intro.strip():
        about_me = custom_intro
    elif custom_obj and custom_obj.about_me:
        about_me = custom_obj.about_me
    elif resume_obj and resume_obj.career_objective:
        about_me = resume_obj.career_objective
    elif about_obj and about_obj.about_me:
        about_me = about_obj.about_me
    else:
        about_me = DEFAULT_ABOUT_ME

    # Career Objective
    career_objective = None
    if custom_obj and custom_obj.career_objective:
        career_objective = custom_obj.career_objective
    elif resume_obj and resume_obj.career_objective:
        career_objective = resume_obj.career_objective
    elif about_obj and about_obj.career_objective:
        career_objective = about_obj.career_objective
    else:
        career_objective = DEFAULT_CAREER_OBJ

    # Location
    location = None
    custom_loc = hero_data.get("location")
    if custom_loc and custom_loc.strip():
        location = custom_loc
    elif custom_obj and custom_obj.location:
        location = custom_obj.location
    elif student.location:
        location = student.location
    else:
        location = "Coimbatore, Tamil Nadu"

    # Skills Categorized & Flat compatibility list
    skills_categorized = {
        "technical": skills_data.get("technical", []),
        "programming": skills_data.get("programming", []),
        "frameworks": skills_data.get("frameworks", []),
        "databases": skills_data.get("databases", []),
        "aiMl": skills_data.get("aiMl", []),
        "softSkills": skills_data.get("softSkills", []),
        "areasOfInterest": skills_data.get("areasOfInterest", [])
    }

    skills = None
    flat_custom_skills = []
    for cat in ["technical", "programming", "frameworks", "databases", "aiMl", "softSkills", "areasOfInterest"]:
        cat_list = skills_categorized.get(cat)
        if cat_list and isinstance(cat_list, list):
            flat_custom_skills.extend(cat_list)

    if flat_custom_skills:
        skills = flat_custom_skills
    elif custom_obj and custom_obj.skills_json:
        try:
            skills = json.loads(custom_obj.skills_json)
        except Exception:
            pass

    if not skills and resume_obj and resume_obj.key_skills_json:
        try:
            skills = json.loads(resume_obj.key_skills_json)
        except Exception:
            pass
            
    if not skills and about_obj and about_obj.skills_json:
        try:
            skills = json.loads(about_obj.skills_json)
        except Exception:
            pass

    if not skills:
        skills = DEFAULT_SKILLS

    # CGPA Resolution
    custom_cgpa = hero_data.get("cgpa")
    if custom_cgpa is None or str(custom_cgpa).strip() == "":
        custom_cgpa = custom_data.get("customCGPA")
    if custom_cgpa is None or str(custom_cgpa).strip() == "":
        custom_cgpa = custom_data.get("customCgpa")
    if custom_cgpa is None or str(custom_cgpa).strip() == "":
        custom_cgpa = custom_data.get("cgpa")

    if custom_cgpa is not None and str(custom_cgpa).strip() != "":
        try:
            cgpa_str = f"{float(custom_cgpa):.2f}"
        except ValueError:
            cgpa_str = ""
    elif student.cgpa is not None:
        cgpa_str = f"{student.cgpa:.2f}"
    elif analytics_obj and analytics_obj.academic_average is not None:
        cgpa_str = f"{analytics_obj.academic_average / 10:.2f}"
    else:
        cgpa_str = ""

    # Normalize customization_data structure to guarantee hero.cgpa is returned
    if "hero" not in custom_data or not isinstance(custom_data["hero"], dict):
        custom_data["hero"] = {}
    custom_data["hero"]["cgpa"] = cgpa_str

    # Toggles
    show_cgpa = hero_data.get("showCgpa", True)
    show_email = hero_data.get("showEmail", True)
    show_phone = hero_data.get("showPhone", True)
    show_register_no = hero_data.get("showRegisterNo", True)
    show_location = hero_data.get("showLocation", True)

    # Social & Resume Links
    github_url = links_data.get("github") or (custom_obj.github_url if custom_obj and custom_obj.github_url else "")
    linkedin_url = links_data.get("linkedin") or (custom_obj.linkedin_url if custom_obj and custom_obj.linkedin_url else "")
    leetcode_url = links_data.get("leetcode") or ""
    hackerrank_url = links_data.get("hackerrank") or ""
    website_url = links_data.get("website") or ""
    resume_url_custom = links_data.get("resume") or ""

    # Email & Phone fallback
    email = None
    custom_email = hero_data.get("email") or links_data.get("email")
    if custom_email and custom_email.strip():
        email = custom_email
    elif custom_obj and custom_obj.email:
        email = custom_obj.email
    elif student.email:
        email = student.email
    else:
        email = "Not added yet"

    phone = None
    custom_phone = hero_data.get("phone") or links_data.get("phone")
    if custom_phone and custom_phone.strip():
        phone = custom_phone
    elif custom_obj and custom_obj.phone:
        phone = custom_obj.phone
    elif student.phone:
        phone = student.phone
    else:
        phone = "Not added yet"

    # Section Visibilities & Titles
    sections_config = {
        "about": {"visible": True, "title": "About"},
        "performance": {"visible": True, "title": "Performance"},
        "resume": {"visible": True, "title": "Resume"},
        "projects": {"visible": True, "title": "Projects"},
        "achievements": {"visible": True, "title": "Achievements"},
        "contact": {"visible": True, "title": "Contact"},
        "certifications": {"visible": True, "title": "Certifications"},
        "internships": {"visible": True, "title": "Internships"},
        "hackathons": {"visible": True, "title": "Hackathons"},
        "publications": {"visible": True, "title": "Publications"},
        "workshops": {"visible": True, "title": "Workshops"}
    }
    
    # Merge existing section_visibility_json config if it's the new format
    for sec_name, sec_def in sections_config.items():
        if sec_name in sections_data:
            if "visible" in sections_data[sec_name]:
                sec_def["visible"] = bool(sections_data[sec_name]["visible"])
            if "title" in sections_data[sec_name] and sections_data[sec_name]["title"]:
                sec_def["title"] = str(sections_data[sec_name]["title"])
        # Support fallback from old flat section visibilities if present
        elif isinstance(custom_data, dict):
            old_mapping = {
                "projects": "showProjects",
                "certifications": "showCertifications",
                "achievements": "showAchievements",
                "performance": "showAcademicHighlights",
                "contact": "showContactLinks",
                "resume": "showResume"
            }
            old_key = old_mapping.get(sec_name)
            if old_key and old_key in custom_data:
                sec_def["visible"] = bool(custom_data[old_key])

    legacy_visibility = {
        "showProjects": sections_config["projects"]["visible"],
        "showCertifications": sections_config["certifications"]["visible"],
        "showAchievements": sections_config["achievements"]["visible"],
        "showAcademicHighlights": sections_config["performance"]["visible"],
        "showContactLinks": sections_config["contact"]["visible"],
        "showResume": sections_config["resume"]["visible"]
    }

    # Music Configuration
    music_config = {
        "visible": False,
        "title": "INTERSTELLAR THEME",
        "artist": "Hans Zimmer"
    }
    if music_data:
        if "visible" in music_data:
            music_config["visible"] = bool(music_data["visible"])
        if "title" in music_data and music_data["title"]:
            music_config["title"] = str(music_data["title"])
        if "artist" in music_data and music_data["artist"]:
            music_config["artist"] = str(music_data["artist"])

    # 3. Format Student section
    student_dict = {
        "id": student.id,
        "register_no": student.register_no,
        "registerNo": student.register_no,
        "name": display_name,
        "email": email if show_email else "",
        "phone": phone if show_phone else "",
        "department": student.department,
        "year": student.year,
        "section": student.section,
        "batch": student.batch,
        "cgpa": float(custom_cgpa) if (custom_cgpa is not None and custom_cgpa != "") else student.cgpa,
        "profile_image": profile_image or "",
        "profileImage": profile_image or "",
    }

    # 4. Format Resume validation
    resume_dict = None
    show_resume = sections_config["resume"]["visible"]

    if resume_obj:
        resume_skills = []
        if resume_obj.key_skills_json:
            try:
                resume_skills = json.loads(resume_obj.key_skills_json)
            except Exception:
                pass
        resume_dict = {
            "id": resume_obj.id,
            "resume_title": resume_obj.resume_title,
            "resumeTitle": resume_obj.resume_title,
            "title": resume_obj.resume_title,
            "preferred_role": resume_obj.preferred_role or "",
            "preferredRole": resume_obj.preferred_role or "",
            "primary_role": resume_obj.preferred_role or "",
            "primaryRole": resume_obj.preferred_role or "",
            "career_objective": resume_obj.career_objective or "",
            "careerObjective": resume_obj.career_objective or "",
            "key_skills": resume_skills,
            "keySkills": resume_skills,
            "skills_json": resume_obj.key_skills_json,
            "skillsJson": resume_obj.key_skills_json,
            "file_name": resume_obj.file_name or "",
            "fileName": resume_obj.file_name or "",
            "file_url": resume_obj.file_path or "",
            "fileUrl": resume_obj.file_path or "",
            "file_path": resume_obj.file_path or "",
            "filePath": resume_obj.file_path or "",
            "resume_url": resume_obj.file_path or "",
            "resumeUrl": resume_obj.file_path or "",
            "github_url": github_url,
            "linkedin_url": linkedin_url,
            "portfolio_url": resume_obj.portfolio_url or "",
            "use_in_portfolio": bool(resume_obj.use_in_portfolio and show_resume),
            "useInPortfolio": bool(resume_obj.use_in_portfolio and show_resume),
            "uploaded_at": resume_obj.updated_at.isoformat() if resume_obj.updated_at else "",
            "updated_at": resume_obj.updated_at.isoformat() if resume_obj.updated_at else "",
            "updatedAt": resume_obj.updated_at.isoformat() if resume_obj.updated_at else ""
        }

    # 5. Format Customizations details
    custom_dict = {
        "headline": headline,
        "about_me": about_me,
        "aboutMe": about_me,
        "career_objective": career_objective,
        "careerObjective": career_objective,
        "skills": skills,
        "github_url": github_url,
        "githubUrl": github_url,
        "linkedin_url": linkedin_url,
        "linkedinUrl": linkedin_url,
        "email": email,
        "phone": phone,
        "location": location,
        "theme": custom_obj.theme if custom_obj else "Dark Minimal",
        "section_visibility_json": legacy_visibility,
        "sectionVisibility": legacy_visibility,
        "resume_visibility": show_resume,
        "resumeVisibility": show_resume,
        
        # Extended custom structures
        "displayName": display_name,
        "welcomeText": welcome_text,
        "avatarInitials": avatar_initials,
        "cgpa": cgpa_str,
        "showCgpa": show_cgpa,
        "showEmail": show_email,
        "showPhone": show_phone,
        "showRegisterNo": show_register_no,
        "showLocation": show_location,
        "skillsCategorized": skills_categorized,
        "links": {
            "github": github_url,
            "linkedin": linkedin_url,
            "leetcode": leetcode_url,
            "hackerrank": hackerrank_url,
            "website": website_url,
            "resume": resume_url_custom
        },
        "sections": sections_config,
        "music": music_config,
        "customization_data": custom_data
    }

    # 6. Format Performance dictionary
    performance_dict = {}
    if analytics_obj:
        domain_scores = {
            "DSA": analytics_obj.dsa_average,
            "DBMS": analytics_obj.dbms_average,
            "FullStack": analytics_obj.fullstack_average,
            "Aptitude": analytics_obj.aptitude_average,
            "Coding": analytics_obj.coding_average,
            "Academic": analytics_obj.academic_average,
            "Technical": analytics_obj.technical_average
        }

        score_history = []
        for sc in scores:
            iso_date = sc.assessment_date.date().isoformat()
            score_history.append({
                "id": sc.id,
                "date": iso_date,
                "assessment_date": iso_date,
                "assessmentDate": iso_date,
                "assessment_name": sc.assessment_name,
                "assessmentName": sc.assessment_name,
                "category": sc.category,
                "score": sc.score,
                "max_marks": sc.max_marks,
                "maxMarks": sc.max_marks,
                "percentage": sc.percentage
            })

        performance_dict = {
            "overall_score": analytics_obj.overall_score,
            "overallScore": analytics_obj.overall_score,
            "domain_scores": domain_scores,
            "domainScores": domain_scores,
            "strongest_domain": analytics_obj.strongest_domain,
            "weakest_domain": analytics_obj.weakest_domain,
            "score_history": score_history,
            "scoreHistory": score_history
        }

    # 7. Format Submissions lists
    serialized_projects = []
    for p in projects:
        pd = to_dict(p)
        tech_list = []
        if p.tech_stack:
            try:
                if p.tech_stack.startswith("["):
                    tech_list = json.loads(p.tech_stack)
                else:
                    tech_list = [s.strip() for s in p.tech_stack.split(",") if s.strip()]
            except Exception:
                tech_list = [p.tech_stack]
        pd["tech_stack"] = tech_list
        pd["techStack"] = tech_list
        pd["proofFile"] = p.proof_file or ""
        pd["proof_file"] = p.proof_file or ""
        pd["githubLink"] = p.github_link or ""
        pd["github_link"] = p.github_link or ""
        pd["liveDemoLink"] = p.live_demo_link or ""
        pd["live_demo_link"] = p.live_demo_link or ""
        pd["mentorFeedback"] = p.mentor_feedback or ""
        pd["mentor_feedback"] = p.mentor_feedback or ""
        serialized_projects.append(pd)

    serialized_certs = []
    for c in certifications:
        cd = to_dict(c)
        cd["proofFile"] = c.proof_file or ""
        cd["proof_file"] = c.proof_file or ""
        cd["certificateLink"] = c.certificate_link or ""
        cd["certificate_link"] = c.certificate_link or ""
        cd["credentialId"] = c.credential_id or ""
        cd["credential_id"] = c.credential_id or ""
        cd["mentorFeedback"] = c.mentor_feedback or ""
        cd["mentor_feedback"] = c.mentor_feedback or ""
        serialized_certs.append(cd)

    serialized_achs = []
    for a in achievements:
        ad = to_dict(a)
        ad["proofFile"] = a.proof_file or ""
        ad["proof_file"] = a.proof_file or ""
        ad["proofLink"] = a.proof_link or ""
        ad["proof_link"] = a.proof_link or ""
        ad["achievementType"] = a.achievement_type
        ad["achievement_type"] = a.achievement_type
        ad["mentorFeedback"] = a.mentor_feedback or ""
        ad["mentor_feedback"] = a.mentor_feedback or ""
        serialized_achs.append(ad)

    # AI Summary
    ai_sum_dict = {}
    if ai_sum_obj:
        ai_sum_dict = {
            "summary": ai_sum_obj.summary,
            "strengths": json.loads(ai_sum_obj.strengths_json) if ai_sum_obj.strengths_json else [],
            "weaknesses": json.loads(ai_sum_obj.weaknesses_json) if ai_sum_obj.weaknesses_json else [],
            "recommendations": json.loads(ai_sum_obj.recommendations_json) if ai_sum_obj.recommendations_json else [],
            "placement_advice": ai_sum_obj.placement_advice or ""
        }

    # Combined payload returning both flat and nested parameters
    portfolio = {
        "student": student_dict,
        "about": {
            "headline": headline,
            "about_me": about_me,
            "aboutMe": about_me,
            "career_objective": career_objective,
            "careerObjective": career_objective,
            "skills": skills
        },
        "headline": headline,
        "career_objective": career_objective,
        "careerObjective": career_objective,
        "skills": skills,
        "github_url": github_url,
        "linkedin_url": linkedin_url,
        "resume_url": resume_dict.get("file_path") if resume_dict else "",
        "has_resume": bool(resume_dict and resume_dict.get("file_path")),
        "resume": resume_dict,
        "performance": performance_dict,
        "projects": serialized_projects,
        "certifications": serialized_certs,
        "achievements": serialized_achs,
        "portfolio_customization": custom_dict,
        "portfolioCustomization": custom_dict,
        "visibility": custom_dict.get("sectionVisibility") or {
            "showProjects": True,
            "showCertifications": True,
            "showAchievements": True,
            "showAcademicHighlights": True,
            "showContactLinks": True,
            "showResume": True
        },
        "ai_summary": ai_sum_dict,
        "aiSummary": ai_sum_dict,
        "profile_image": profile_image or "",
        "profileImage": profile_image or "",
        "cgpa": cgpa_str
    }

    return portfolio
