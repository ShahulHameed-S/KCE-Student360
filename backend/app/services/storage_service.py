import os
import uuid
from typing import Dict
from fastapi import UploadFile, HTTPException
from supabase import create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "student360-uploads")


def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="Supabase storage is not configured"
        )

    return create_client(url, key)


ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}
DANGEROUS_EXTENSIONS = {"exe", "bat", "cmd", "sh", "js", "php", "py"}


def get_file_extension(filename: str) -> str:
    if not filename or "." not in filename:
        raise HTTPException(status_code=400, detail="Invalid file name")

    return filename.rsplit(".", 1)[-1].lower()


async def upload_file_to_supabase(
    file: UploadFile,
    folder: str,
    max_size_mb: int = 10
) -> Dict[str, str]:
    supabase = get_supabase_client()

    extension = get_file_extension(file.filename)

    if extension in DANGEROUS_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="This file type is not allowed"
        )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG, JPEG, and WEBP files are allowed"
        )

    file_bytes = await file.read()

    max_size_bytes = max_size_mb * 1024 * 1024

    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size should be less than {max_size_mb}MB"
        )

    unique_filename = f"{folder}/{uuid.uuid4()}.{extension}"

    content_type = file.content_type or "application/octet-stream"

    supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
        path=unique_filename,
        file=file_bytes,
        file_options={
            "content-type": content_type,
            "upsert": "false"
        }
    )

    public_url = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(
        unique_filename
    )

    return {
        "file_url": public_url,
        "file_path": unique_filename,
        "original_filename": file.filename
    }