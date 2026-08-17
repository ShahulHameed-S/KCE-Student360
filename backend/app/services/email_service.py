import os
import smtplib
from email.mime.text import MIMEText
from app.config import settings

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """
    Sends an OTP email to the recipient.
    If ENVIRONMENT == "development" and SMTP details are missing, falls back to writing to scratch/last_otp.txt.
    In production, raises an exception if SMTP variables are missing.
    Never prints the plain OTP in stdout logs.
    """
    env = (settings.ENVIRONMENT or "development").lower()
    
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    smtp_from = settings.SMTP_FROM
    
    smtp_configured = all([smtp_host, smtp_port, smtp_user, smtp_password, smtp_from])
    
    if not smtp_configured:
        if env == "production":
            raise Exception("SMTP email service is not configured in production environment.")
        else:
            # Development fallback
            try:
                # Find scratch directory relative to project root or app root
                app_dir = os.path.abspath(os.path.dirname(__file__))
                # Try project root scratch (relative to backend/app/services)
                scratch_dir = os.path.abspath(os.path.join(app_dir, "..", "..", "..", "scratch"))
                if not os.path.exists(scratch_dir):
                    # Fallback to backend root scratch
                    scratch_dir = os.path.abspath(os.path.join(app_dir, "..", "..", "scratch"))
                os.makedirs(scratch_dir, exist_ok=True)
                
                filepath = os.path.join(scratch_dir, "last_otp.txt")
                with open(filepath, "w") as f:
                    f.write(f"Recipient: {recipient_email}\nOTP: {otp}\n")
                
                print(f"[EMAIL FALLBACK] SMTP not configured. Wrote dev OTP to {filepath}")
                return True
            except Exception as e:
                raise Exception(f"Failed to write dev OTP to scratch file: {str(e)}")
                
    try:
        # Construct email message
        msg = MIMEText(
            f"Hello,\n\n"
            f"You requested to reset your password. Here is your One-Time Password (OTP):\n\n"
            f"{otp}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Best regards,\n"
            f"Student360 Admin Team"
        )
        msg["Subject"] = "Student360 Password Reset OTP"
        msg["From"] = smtp_from
        msg["To"] = recipient_email
        
        # Connect to SMTP server
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"[EMAIL SERVICE] Successfully sent OTP email to {recipient_email}")
        return True
    except Exception as e:
        raise Exception(f"SMTP email transmission failed: {str(e)}")
