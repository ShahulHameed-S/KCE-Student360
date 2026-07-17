import json
import httpx
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.models.student import Student
from app.models.score import StudentAnalytics, AssessmentScore
from app.models.submission import StudentProject, StudentCertification, StudentAchievement
from app.models.profile import UserProfile
from app.models.ai_summary import AISummary

def generate_rule_based_performance_summary(
    student: Student,
    analytics: StudentAnalytics,
    scores: list,
    projects: list,
    certs: list,
    achieves: list
) -> dict:
    """
    Generates a deterministic performance summary, strengths, weaknesses, 
    recommendations, and placement advice based on database metrics.
    """
    if not analytics:
        return {
            "summary": f"{student.name} is a student in the {student.department} department. No test metrics are available yet.",
            "strengths": [],
            "weaknesses": [],
            "recommendations": ["Participate in initial assessment tests to build profile metrics."],
            "placement_advice": "Structured training is recommended as performance metrics are pending.",
            "placementAdvice": "Structured training is recommended as performance metrics are pending."
        }

    # 1. Strengths (>= 85) & Weaknesses (< 80)
    domain_map = {
        "DSA": analytics.dsa_average,
        "DBMS": analytics.dbms_average,
        "FullStack": analytics.fullstack_average,
        "Aptitude": analytics.aptitude_average,
        "Coding": analytics.coding_average,
        "Academic": analytics.academic_average,
        "Technical": analytics.technical_average
    }

    strengths = [cat for cat, score in domain_map.items() if score >= 85.0]
    weaknesses = [cat for cat, score in domain_map.items() if score < 80.0]

    # If no strengths/weaknesses fit criteria, fallback to highest and lowest
    if not strengths and domain_map:
        highest_cat = max(domain_map, key=domain_map.get)
        if domain_map[highest_cat] > 0:
            strengths = [highest_cat]
            
    if not weaknesses and domain_map:
        lowest_cat = min(domain_map, key=domain_map.get)
        if domain_map[lowest_cat] < 85.0:
            weaknesses = [lowest_cat]

    # 2. Recommendations
    recommendations = []
    weakest = analytics.weakest_domain or (min(domain_map, key=domain_map.get) if domain_map else None)

    if weakest == "DBMS":
        recommendations = [
            "Practice complex SQL joins and subqueries on platforms like LeetCode or HackerRank.",
            "Revise database normalization (1NF, 2NF, 3NF, BCNF) and transaction ACID properties.",
            "Build one database-backed project to apply database schema design concepts practically."
        ]
    elif weakest == "Aptitude":
        recommendations = [
            "Practice daily aptitude sets covering quantitative, logical, and verbal topics.",
            "Take weekly timed mock tests to improve time management and speed.",
            "Improve speed and accuracy on core concepts like percentages, ratios, and permutations."
        ]
    elif weakest == "DSA":
        recommendations = [
            "Practice fundamental data structures: arrays, strings, stacks, and linked lists.",
            "Revise core algorithms: searching, sorting, recursion, trees, and graphs.",
            "Solve coding problems consistently (at least 2-3 per day) to build problem-solving muscle."
        ]
    elif weakest == "Coding":
        recommendations = [
            "Practice timed coding contests on platforms like CodeChef, Codeforces, or LeetCode.",
            "Improve implementation speed and reduce compilation error rates.",
            "Revise syntax and libraries of your primary programming language (e.g. Java, Python, C++)."
        ]
    elif weakest == "Academic":
        recommendations = [
            "Review core subject lecture notes and text materials regularly.",
            "Improve semester exam consistency and class assessment scores.",
            "Engage in academic study groups to clarify fundamentals."
        ]
    elif weakest == "Technical":
        recommendations = [
            "Practice technical interview questions regarding core computer science concepts.",
            "Revise CS fundamentals (OS, Networks, OOPS, and System Design).",
            "Solve mock technical interviews and explain code complexity out loud."
        ]
    else:
        recommendations = [
            "Maintain consistent coding practices daily to keep problem-solving skills sharp.",
            "Build more real-world software projects to expand your repository portfolio.",
            "Practice mock interview sessions to boost behavioral and presentation skills."
        ]

    # 3. Placement Advice based on readiness level
    level = analytics.placement_readiness_level
    if level == "Placement Ready":
        placement_advice = (
            "Student is ready for placement-level preparation. Focus on advanced coding interviews, "
            "system design basics, and mock interview communication practices."
        )
    elif level == "Almost Ready":
        placement_advice = (
            f"Student is close to placement readiness (Score: {analytics.placement_readiness_score}%). "
            f"Should focus on bolstering weak domains ({', '.join(weaknesses) if weaknesses else weakest}) "
            "and completing pending certifications."
        )
    else:
        # Needs Training
        placement_advice = (
            "Student requires structured training before placement drives. Focus heavily on core subjects, "
            "solving daily coding practices, and creating fundamental resume projects."
        )

    # 4. Narrative Summary
    strong_str = ", ".join(strengths) if strengths else "various topics"
    weak_str = ", ".join(weaknesses) if weaknesses else weakest or "none"
    
    summary = (
        f"{student.name} shows strong performance in {strong_str} domains with an overall average of "
        f"{analytics.overall_score}%. "
    )
    if weaknesses:
        summary += f"However, capabilities in {weak_str} require more targeted improvement and revision."
    else:
        summary += "Consistent capabilities are demonstrated across all tested evaluation categories."

    return {
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "placement_advice": placement_advice,
        "placementAdvice": placement_advice
    }

def get_llm_provider() -> str:
    provider = settings.LLM_PROVIDER.lower() if settings.LLM_PROVIDER else "mock"
    
    if provider == "gemini":
        if settings.GEMINI_API_KEY:
            return "gemini"
        return "mock"
    elif provider == "groq":
        if settings.GROQ_API_KEY:
            return "groq"
        return "mock"
    elif provider == "openrouter":
        if settings.OPENROUTER_API_KEY:
            return "openrouter"
        return "mock"
    elif provider == "mock":
        return "mock"
        
    # Auto-detect fallback: Use Gemini first, then Groq, then OpenRouter
    if settings.GEMINI_API_KEY:
        return "gemini"
    elif settings.GROQ_API_KEY:
        return "groq"
    elif settings.OPENROUTER_API_KEY:
        return "openrouter"
        
    return "mock"

def parse_json_from_llm(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            block_header = text[:first_newline].strip().lower()
            if "json" in block_header or block_header == "```":
                text = text[first_newline:].strip()
        if text.endswith("```"):
            text = text[:-3].strip()
            
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            try:
                return json.loads(text[start_idx:end_idx+1])
            except json.JSONDecodeError:
                pass
        raise

async def call_llm_provider(prompt: str, system_instruction: str = None) -> str:
    provider = get_llm_provider()
    
    if provider == "gemini":
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        contents = [{
            "parts": [{"text": prompt}]
        }]
        payload = {
            "contents": contents
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
            
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            resp.raise_for_status()
            raise Exception(f"Gemini API returned empty response: {resp.text}")
            
    elif provider == "groq":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.2
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
            resp.raise_for_status()
            raise Exception(f"Groq API returned empty response: {resp.text}")
            
    elif provider == "openrouter":
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.FRONTEND_URL,
            "X-Title": "KCE Student360"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": messages
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
            resp.raise_for_status()
            raise Exception(f"OpenRouter API returned empty response: {resp.text}")
            
    raise Exception(f"Provider {provider} is not supported or not active.")

async def generate_student_ai_summary(db: Session, student_id: int) -> dict:
    """
    Attempts to generate student summary using Ollama LLM provider.
    Falls back to deterministic rule-based generator if Ollama is unreachable.
    Saves the final generated result into the AISummary table.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {}

    analytics = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student_id).first()
    scores = db.query(AssessmentScore).filter(AssessmentScore.student_id == student_id).all()
    projects = db.query(StudentProject).filter(StudentProject.student_id == student_id, StudentProject.status == "Approved").all()
    certs = db.query(StudentCertification).filter(StudentCertification.student_id == student_id, StudentCertification.status == "Approved").all()
    achieves = db.query(StudentAchievement).filter(StudentAchievement.student_id == student_id, StudentAchievement.status == "Approved").all()

    # Get rule-based base metrics
    rule_data = generate_rule_based_performance_summary(
        student, analytics, scores, projects, certs, achieves
    )

    # Check if a cloud LLM provider is active
    active_provider = get_llm_provider()
    if active_provider != "mock" and analytics:
        prompt = (
            f"Generate a professional, encouraging student performance summary and placement advice in English "
            f"based on the following student performance metrics:\n"
            f"Student Name: {student.name}\n"
            f"Department: {student.department}\n"
            f"Overall average score: {analytics.overall_score}%\n"
            f"Domain averages: DSA ({analytics.dsa_average}%), DBMS ({analytics.dbms_average}%), "
            f"FullStack ({analytics.fullstack_average}%), Aptitude ({analytics.aptitude_average}%), "
            f"Coding ({analytics.coding_average}%), Academic ({analytics.academic_average}%), "
            f"Technical ({analytics.technical_average}%)\n"
            f"Strongest domain: {analytics.strongest_domain}\n"
            f"Weakest domain: {analytics.weakest_domain}\n"
            f"Approved projects count: {len(projects)}\n"
            f"Approved certifications count: {len(certs)}\n"
            f"Approved achievements count: {len(achieves)}\n"
            f"Placement Readiness Score: {analytics.placement_readiness_score} ({analytics.placement_readiness_level})\n\n"
            f"Output must be a JSON object matching this exact schema:\n"
            f'{{"summary": "...", "placement_advice": "..."}}\n'
            f"Do not include any other markdown tags or conversational prefix, only output raw JSON."
        )

        try:
            response_text = await call_llm_provider(
                prompt=prompt,
                system_instruction="You are a helpful education analyst. Answer only with raw JSON matching the requested schema."
            )
            if response_text:
                parsed = parse_json_from_llm(response_text)
                if "summary" in parsed:
                    rule_data["summary"] = parsed["summary"]
                if "placement_advice" in parsed:
                    rule_data["placement_advice"] = parsed["placement_advice"]
                    rule_data["placementAdvice"] = parsed["placement_advice"]
        except Exception as e:
            # Fallback to rule-based silently on error
            logger.error(f"Error generating AI summary using {active_provider}: {str(e)}")
            pass

    # Save to AISummary table
    ai_sum = db.query(AISummary).filter(AISummary.student_id == student_id).first()
    if not ai_sum:
        ai_sum = AISummary(student_id=student_id)
        db.add(ai_sum)

    ai_sum.summary = rule_data["summary"]
    ai_sum.strengths_json = json.dumps(rule_data["strengths"])
    ai_sum.weaknesses_json = json.dumps(rule_data["weaknesses"])
    ai_sum.recommendations_json = json.dumps(rule_data["recommendations"])
    ai_sum.placement_advice = rule_data["placement_advice"]
    
    db.commit()
    db.refresh(ai_sum)

    return rule_data

def execute_faculty_query(db: Session, query_str: str) -> dict:
    """
    Parses natural language query patterns submitted by faculties/mentors
    and retrieves structured student database query outputs.
    """
    normalized_query = query_str.lower().strip()
    
    # 1. Initialize result structure
    intent = "general"
    domain = "Overall"
    limit = 10
    students_list = []
    answer = "No matching query pattern detected. Try queries like 'Top 10 DSA students' or 'Students needing attention'."

    # Helper serializer for student rankings
    def map_student_row(student: Student, analytics: StudentAnalytics, idx: int, target_domain: str = "Overall"):
        # Select target domain average
        if target_domain == "DSA":
            domain_score = analytics.dsa_average
        elif target_domain == "DBMS":
            domain_score = analytics.dbms_average
        elif target_domain == "FullStack":
            domain_score = analytics.fullstack_average
        elif target_domain == "Aptitude":
            domain_score = analytics.aptitude_average
        elif target_domain in ["Coding", "Java", "Python"]:
            domain_score = analytics.coding_average
        elif target_domain == "Academic":
            domain_score = analytics.academic_average
        elif target_domain == "Technical":
            domain_score = analytics.technical_average
        elif target_domain == "Placement":
            domain_score = analytics.placement_readiness_score
        else:
            domain_score = analytics.overall_score

        return {
            "rank": idx + 1,
            "id": student.id,
            "register_no": student.register_no,
            "registerNo": student.register_no,
            "name": student.name,
            "score": domain_score,
            "overall_score": analytics.overall_score,
            "overallScore": analytics.overall_score,
            "domain_score": domain_score,
            "domainScore": domain_score,
            "strongest_domain": analytics.strongest_domain,
            "strongestDomain": analytics.strongest_domain,
            "weakest_domain": analytics.weakest_domain,
            "weakestDomain": analytics.weakest_domain,
            "placement_readiness_score": analytics.placement_readiness_score,
            "placementReadinessScore": analytics.placement_readiness_score,
            "placement_readiness_level": analytics.placement_readiness_level,
            "placementReadinessLevel": analytics.placement_readiness_level,
            "profile_image": student.profile_image or "",
            "profileImage": student.profile_image or ""
        }

    # 1.5. Check if query requests summary or performance of a specific student
    student_match = None
    if any(keyword in normalized_query for keyword in ["summary", "performance", "report", "analyse", "analyze"]):
        # Check database for matching register_no or name in the query string
        all_students = db.query(Student).all()
        for s in all_students:
            if s.register_no.lower() in normalized_query or (s.name and s.name.lower() in normalized_query):
                student_match = s
                break
                
    if student_match:
        # Load associated metrics synchronously
        analytics = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student_match.id).first()
        scores = db.query(AssessmentScore).filter(AssessmentScore.student_id == student_match.id).all()
        projects = db.query(StudentProject).filter(StudentProject.student_id == student_match.id, StudentProject.status == "Approved").all()
        certs = db.query(StudentCertification).filter(StudentCertification.student_id == student_match.id, StudentCertification.status == "Approved").all()
        achieves = db.query(StudentAchievement).filter(StudentAchievement.student_id == student_match.id, StudentAchievement.status == "Approved").all()
        
        rule_data = generate_rule_based_performance_summary(
            student_match, analytics, scores, projects, certs, achieves
        )
        
        # Format a nice static summary answer
        summary_text = (
            f"### Student Performance Summary for {student_match.name} ({student_match.register_no})\n\n"
            f"**Department:** {student_match.department}\n\n"
            f"**Summary:** {rule_data['summary']}\n\n"
            f"**Strengths:** {', '.join(rule_data['strengths']) if rule_data['strengths'] else 'None identified'}\n\n"
            f"**Weaknesses:** {', '.join(rule_data['weaknesses']) if rule_data['weaknesses'] else 'None identified'}\n\n"
            f"**Recommendations:**\n" + "\n".join([f"- {r}" for r in rule_data['recommendations']]) + "\n\n"
            f"**Placement Advice:** {rule_data['placement_advice']}"
        )
        
        mock_analytics = analytics or StudentAnalytics(
            student_id=student_match.id,
            overall_score=0.0,
            placement_readiness_score=0.0,
            placement_readiness_level="Needs Training"
        )
        students_list = [map_student_row(student_match, mock_analytics, 0, "Overall")]
        
        return {
            "intent": "student_summary",
            "domain": "Overall",
            "limit": 1,
            "students": students_list,
            "answer": summary_text
        }

    # 2. Check query intent mappings
    # Leaderboard Domain topper queries
    domains_check = {
        "dsa": "DSA",
        "dbms": "DBMS",
        "fullstack": "FullStack",
        "full stack": "FullStack",
        "aptitude": "Aptitude",
        "coding": "Coding",
        "academic": "Academic",
        "technical": "Technical",
        "java": "Java",
        "python": "Python"
    }

    # Extract limit from query (e.g. "top 5", "top 10")
    num_match = re.search(r'\b\d+\b', normalized_query)
    limit = int(num_match.group(0)) if num_match else 10

    # Match Domain toppers
    matched_domain = None
    for pattern, d_name in domains_check.items():
        if pattern in normalized_query:
            if any(keyword in normalized_query for keyword in ["top", "topper", "best", "rank", "leaderboard", "student"]):
                matched_domain = d_name
                break

    if matched_domain:
        intent = "leaderboard"
        domain = matched_domain
        
        # Query sorting by selected domain score
        query = db.query(Student, StudentAnalytics).join(
            StudentAnalytics, Student.id == StudentAnalytics.student_id
        )
        if matched_domain == "DSA":
            query = query.order_by(StudentAnalytics.dsa_average.desc())
        elif matched_domain == "DBMS":
            query = query.order_by(StudentAnalytics.dbms_average.desc())
        elif matched_domain == "FullStack":
            query = query.order_by(StudentAnalytics.fullstack_average.desc())
        elif matched_domain == "Aptitude":
            query = query.order_by(StudentAnalytics.aptitude_average.desc())
        elif matched_domain in ["Coding", "Java", "Python"]:
            query = query.order_by(StudentAnalytics.coding_average.desc())
        elif matched_domain == "Academic":
            query = query.order_by(StudentAnalytics.academic_average.desc())
        elif matched_domain == "Technical":
            query = query.order_by(StudentAnalytics.technical_average.desc())

        results = query.limit(limit).all()
        students_list = [map_student_row(s, a, i, matched_domain) for i, (s, a) in enumerate(results)]
        answer = f"Here are the top {limit} {matched_domain} students based on verified test averages."

    # Match Overall toppers
    elif "overall toppers" in normalized_query or "top 10 overall" in normalized_query or ("overall" in normalized_query and ("top" in normalized_query or "topper" in normalized_query)):
        intent = "leaderboard"
        domain = "Overall"

        query = db.query(Student, StudentAnalytics).join(
            StudentAnalytics, Student.id == StudentAnalytics.student_id
        ).order_by(StudentAnalytics.overall_score.desc()).limit(limit)
        
        results = query.all()
        students_list = [map_student_row(s, a, i, "Overall") for i, (s, a) in enumerate(results)]
        answer = f"Here are the top overall student performers based on cumulative average scores."

    # Match Placement Ready
    elif "placement" in normalized_query or "ready" in normalized_query:
        intent = "placement_readiness"
        domain = "Overall"

        # Retrieve students with Placement Ready status
        query = db.query(Student, StudentAnalytics).join(
            StudentAnalytics, Student.id == StudentAnalytics.student_id
        ).filter(
            StudentAnalytics.placement_readiness_level == "Placement Ready"
        ).order_by(StudentAnalytics.placement_readiness_score.desc()).limit(limit)

        results = query.all()
        if not results:
            query = db.query(Student, StudentAnalytics).join(
                StudentAnalytics, Student.id == StudentAnalytics.student_id
            ).order_by(StudentAnalytics.placement_readiness_score.desc()).limit(limit)
            results = query.all()

        students_list = [map_student_row(s, a, i, "Placement") for i, (s, a) in enumerate(results)]
        answer = f"Here are the top students (up to {limit}) who are classified as 'Placement Ready'."

    # Match Below Average
    elif "below average" in normalized_query or "below class average" in normalized_query:
        intent = "below_average"
        domain = "Overall"

        # Calculate overall class average
        avg_score = db.query(func.avg(StudentAnalytics.overall_score)).scalar()
        if avg_score is None:
            avg_score = 0.0
            
        query = db.query(Student, StudentAnalytics).join(
            StudentAnalytics, Student.id == StudentAnalytics.student_id
        ).filter(
            StudentAnalytics.overall_score < avg_score
        ).order_by(StudentAnalytics.overall_score.asc()).limit(limit)

        results = query.all()
        students_list = [map_student_row(s, a, i, "Overall") for i, (s, a) in enumerate(results)]
        answer = f"Here are students performing below the overall class average of {round(avg_score, 2)}%."

    # Match Needing Attention / Weak Students
    elif "needing attention" in normalized_query or "attention" in normalized_query or "weak" in normalized_query:
        intent = "needing_attention"
        domain = "Overall"

        # Filter criteria: overall < 70 OR placement_level == Needs Training OR any domain < 70
        query = db.query(Student, StudentAnalytics).join(
            StudentAnalytics, Student.id == StudentAnalytics.student_id
        ).filter(
            (StudentAnalytics.overall_score < 70.0) |
            (StudentAnalytics.placement_readiness_level == "Needs Training") |
            (StudentAnalytics.dsa_average < 70.0) |
            (StudentAnalytics.dbms_average < 70.0) |
            (StudentAnalytics.fullstack_average < 70.0) |
            (StudentAnalytics.aptitude_average < 70.0) |
            (StudentAnalytics.coding_average < 70.0) |
            (StudentAnalytics.academic_average < 70.0) |
            (StudentAnalytics.technical_average < 70.0)
        ).order_by(StudentAnalytics.overall_score.asc()).limit(limit)

        results = query.all()
        students_list = [map_student_row(s, a, i, "Overall") for i, (s, a) in enumerate(results)]
        answer = f"Here are the top {limit} students flagged as weak or needing attention based on test scores and placement metrics."

    return {
        "intent": intent,
        "domain": domain,
        "limit": limit,
        "students": students_list,
        "answer": answer
    }

async def execute_assistant_query(db: Session, query_str: str) -> dict:
    """
    Executes database search first, then uses the active LLM provider (Gemini, Groq, OpenRouter)
    to summarize/explain the database records. If LLM provider is 'mock' or fails, it falls back
    to the rule-based static response.
    """
    # 1. Run database query first using execute_faculty_query
    result = execute_faculty_query(db, query_str)
    
    # 2. Check active LLM provider
    active_provider = get_llm_provider()
    
    print("AI Assistant provider:", active_provider)
    print("Gemini API key exists:", bool(settings.GEMINI_API_KEY))
    
    if active_provider == "mock":
        result["provider"] = "mock"
        return result
        
    try:
        if result["intent"] == "general":
            # General query - use LLM to answer conversationally
            system_instruction = (
                "You are KCE Student360 AI Assistant, a helpful AI assistant for faculty and mentors "
                "at Karpagam College of Engineering (KCE). Answer the faculty member's question directly, "
                "professionally, and in a friendly tone. Use markdown styling for formatting."
            )
            prompt = f"Faculty member query: {query_str}"
            response = await call_llm_provider(prompt=prompt, system_instruction=system_instruction)
            if response:
                result["answer"] = response
        else:
            # Database-first query - format the retrieved database records as context and ask LLM to explain them
            students_info = ""
            for idx, s in enumerate(result["students"]):
                students_info += (
                    f"- Rank {s.get('rank') or idx+1}: Name: {s.get('name')}, Register No: {s.get('register_no')}, "
                    f"Score: {s.get('score')}%, Overall Score: {s.get('overall_score')}%, "
                    f"Strongest Domain: {s.get('strongest_domain') or 'N/A'}, Weakest Domain: {s.get('weakest_domain') or 'N/A'}, "
                    f"Placement Readiness Level: {s.get('placement_readiness_level') or 'N/A'}\n"
                )
            
            system_instruction = (
                "You are KCE Student360 AI Assistant, an education analyst for Karpagam College of Engineering (KCE). "
                "Analyze the provided student database records to explain and summarize them to the faculty member. "
                "CRITICAL SECURITY RULES:\n"
                "1. Do NOT invent, assume, or change any student names, register numbers, scores, ranks, or placement readiness levels. Only refer to the database records listed below.\n"
                "2. If the student list is empty, state clearly that no students matched this search criteria in the database.\n"
                "3. Keep the response concise, informative, and professional."
            )
            
            prompt = (
                f"The faculty member asked: \"{query_str}\"\n\n"
                f"Here are the real student records matching this search query retrieved from the database:\n"
                f"{students_info or '(No students found in database matching this criteria)'}\n\n"
                f"Please summarize and explain these database results for the faculty member."
            )
            
            response = await call_llm_provider(prompt=prompt, system_instruction=system_instruction)
            if response:
                result["answer"] = response
                
        result["provider"] = active_provider
    except Exception as e:
        if active_provider == "gemini":
            print("Gemini call failed:", str(e))
        else:
            print(f"{active_provider.capitalize()} call failed: {str(e)}")
            
        logger.error(f"Error in execute_assistant_query using provider {active_provider}: {str(e)}")
        # Keep the default result["answer"] if call fails, fallback provider to mock
        result["provider"] = "mock"
        
    return result
