from app.config import settings

def sanitize_external_url(url: str) -> str:
    """
    Validates and sanitizes external portfolio URLs.
    Allows only http:// and https:// schemes.
    Rejects unsafe protocols (javascript:, data:, file:, ftp:) and local addresses (localhost, 127.0.0.1).
    """
    if not url or not isinstance(url, str):
        return ""
    clean = url.strip()
    if not clean:
        return ""
    lower = clean.lower()
    
    # Reject unsafe protocols and local addresses
    forbidden = ["javascript:", "data:", "file:", "ftp:", "localhost", "127.0.0.1"]
    for f in forbidden:
        if f in lower:
            return ""
            
    if not (lower.startswith("http://") or lower.startswith("https://")):
        return ""
        
    return clean

def build_portfolio_urls(register_no: str, external_url: str = None) -> dict:
    """
    Constructs portfolio URL payload containing:
    - external_portfolio_url
    - default_portfolio_url
    - student360_portfolio_url
    """
    frontend_base = settings.FRONTEND_URL.rstrip('/') if settings.FRONTEND_URL else "https://kce-student360.vercel.app"
    clean_external = sanitize_external_url(external_url) if external_url else ""
    reg_clean = (register_no or "").strip()
    default_url = f"{frontend_base}/portfolio/{reg_clean}" if reg_clean else ""
    
    return {
        "external_portfolio_url": clean_external,
        "default_portfolio_url": default_url,
        "student360_portfolio_url": default_url
    }
