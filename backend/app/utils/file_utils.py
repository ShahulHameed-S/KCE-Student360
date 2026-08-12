import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.config import settings

def get_supabase_client():
    """Initializes and returns Supabase client using configured keys."""
    supabase_url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL")
    supabase_key = (
        settings.SUPABASE_SERVICE_ROLE_KEY or
        settings.SUPABASE_KEY or
        settings.SUPABASE_ANON_KEY or
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
        os.environ.get("SUPABASE_KEY") or
        os.environ.get("SUPABASE_ANON_KEY")
    )
    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            return create_client(supabase_url, supabase_key)
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {e}")
    return None

ALLOWED_EXTENSIONS = {
    "profile": {".jpg", ".jpeg", ".png", ".webp"},
    "resumes": {".pdf", ".doc", ".docx"},
    "projects": {".jpg", ".jpeg", ".png", ".webp", ".pdf"},
    "certificates": {".jpg", ".jpeg", ".png", ".webp", ".pdf"},
    "achievements": {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
}

def get_safe_filename(original_filename: str, user_id: int = None) -> str:
    """Generates a clean filename using timestamp and a random UUID."""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_id = uuid.uuid4().hex[:8]
    if user_id:
        return f"{user_id}_{timestamp}_{random_id}{ext}"
    return f"{timestamp}_{random_id}{ext}"

async def save_upload_file(file: UploadFile, folder: str, user_id: int = None) -> str:
    """
    Saves an uploaded file either to Supabase Storage or to the local filesystem.
    
    Args:
        file (UploadFile): The uploaded file object.
        folder (str): Target subfolder name ('profile', 'resumes', 'projects', 'certificates', 'achievements').
        user_id (int, optional): Authenticated user ID for filename prefix.
        
    Returns:
        str: The accessible URL/path of the saved file.
    """
    if folder not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid upload category: '{folder}'")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS[folder]:
        raise HTTPException(
            status_code=400, 
            detail=f"Extension '{ext}' not allowed for category '{folder}'. Allowed: {list(ALLOWED_EXTENSIONS[folder])}"
        )

    filename = get_safe_filename(file.filename, user_id=user_id)
    
    # Read file content bytes
    content = await file.read()
    
    # Reset file cursor just in case it is read again
    await file.seek(0)

    # 1. Supabase Storage Option
    client = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET or os.environ.get("SUPABASE_STORAGE_BUCKET") or "student360-uploads"
    folder_path = "profile-images" if folder in ["profile", "profile-images"] else folder
    path_in_bucket = f"{folder_path}/{filename}"
    content_type = file.content_type or "application/octet-stream"

    print("PROFILE IMAGE UPLOAD STARTED")
    print("filename:", file.filename)
    print("bucket:", bucket)
    print("supabase_url:", settings.SUPABASE_URL or os.environ.get("SUPABASE_URL"))
    print("upload path:", path_in_bucket)

    if not client:
        err_msg = "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable is missing on backend server."
        print(f"[STORAGE_ERROR] {err_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to upload profile image to Supabase Storage: {err_msg}")

    try:
        client.storage.from_(bucket).upload(
            path=path_in_bucket,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        public_url = client.storage.from_(bucket).get_public_url(path_in_bucket)
        if public_url:
            print(f"[STORAGE_SUCCESS] Uploaded to Supabase Storage: {public_url}")
            return public_url, bucket, path_in_bucket
    except Exception as e:
        print(f"[STORAGE_ERROR] Supabase Storage upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile image to Supabase Storage: {str(e)}"
        )
