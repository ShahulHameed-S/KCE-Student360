from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.leaderboard_service import get_leaderboard_data

router = APIRouter()

@router.get("/debug")
async def debug_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to inspect leaderboard stats for the current user."""
    data = get_leaderboard_data(db, "Overall", current_user=current_user)
    with_scores = [d for d in data if d.get("overall_score") is not None]
    without_scores = [d for d in data if d.get("overall_score") is None]
    return {
        "user_role": current_user.role if current_user else "anonymous",
        "mentor_email": current_user.email if current_user else None,
        "students_found": len(data),
        "students_with_scores": len(with_scores),
        "students_without_scores": len(without_scores),
        "first_students": [
            {
                "register_no": d.get("register_no"),
                "name": d.get("name"),
                "overall_score": d.get("overall_score")
            }
            for d in data[:3]
        ]
    }

@router.get("/overall")
async def get_overall_leaderboard(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Retrieves overall ranked leaderboard of student performance scores."""
    from app.services.cache_service import get_cache, set_cache
    user_id = current_user.id if current_user else "public"
    role = current_user.role if current_user else "public"
    batch = getattr(current_user.student_profile, "batch", "all") if (current_user and current_user.student_profile) else "all"
    page = "1"
    limit = "all"
    cache_key = f"leaderboard_overall:{role}:{user_id}:{batch}:{page}:{limit}"
    
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    data = get_leaderboard_data(db, "Overall", current_user=current_user)
    set_cache(cache_key, data, ttl_seconds=60)
    return data

@router.get("/domain/{domain}")
async def get_domain_leaderboard(
    domain: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Retrieves domain-specific ranked leaderboard sorted by domain average."""
    from app.services.cache_service import get_cache, set_cache
    user_id = current_user.id if current_user else "public"
    role = current_user.role if current_user else "public"
    batch = getattr(current_user.student_profile, "batch", "all") if (current_user and current_user.student_profile) else "all"
    page = "1"
    limit = "all"
    cache_key = f"leaderboard_domain:{role}:{user_id}:{domain}:{batch}:{page}:{limit}"
    
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    data = get_leaderboard_data(db, domain, current_user=current_user)
    set_cache(cache_key, data, ttl_seconds=60)
    return data
