from typing import Optional

VALID_DOMAINS = {"DSA", "DBMS", "FullStack", "Aptitude", "Coding", "Academic", "Technical"}

def normalize_domain(category: str) -> Optional[str]:
    """
    Normalizes subject category input to match backend database values.
    Example: 'Full Stack', 'fullstack', 'full-stack', 'FULLSTACK' -> 'FullStack'
    """
    if not category:
        return None
        
    cleaned = str(category).strip().replace(" ", "").replace("-", "").replace("_", "").lower()
    
    # Check normalization map
    norm_map = {
        "dsa": "DSA",
        "datastructures": "DSA",
        "datastructuresandalgorithms": "DSA",
        "datastructuresalgorithms": "DSA",
        "dbms": "DBMS",
        "databasesystems": "DBMS",
        "database": "DBMS",
        "fullstack": "FullStack",
        "fullstackdevelopment": "FullStack",
        "fullstackdev": "FullStack",
        "aptitude": "Aptitude",
        "quantitativeaptitude": "Aptitude",
        "quant": "Aptitude",
        "coding": "Coding",
        "competitivecoding": "Coding",
        "compcoding": "Coding",
        "academic": "Academic",
        "academics": "Academic",
        "cgpa": "Academic",
        "gpa": "Academic",
        "technical": "Technical",
        "coretechnical": "Technical",
        "technicallab": "Technical",
        "technicallabs": "Technical"
    }
    
    normalized = norm_map.get(cleaned)
    if normalized in VALID_DOMAINS:
        return normalized

    # Fallback case-insensitive check against valid domains
    for valid in VALID_DOMAINS:
        if valid.lower() == cleaned:
            return valid

    return None

def is_valid_domain(category: str) -> bool:
    """Checks if the given category string (after normalization) is valid."""
    return normalize_domain(category) is not None
