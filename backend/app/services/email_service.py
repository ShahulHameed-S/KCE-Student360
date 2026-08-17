import os
import smtplib
from email.mime.text import MIMEText
from app.config import settings

def send_otp_email(recipient_email: str, otp: str, role: str = "student") -> bool:
    """
    Sends an OTP email to the recipient.
    Supports fallback names for Render/production environment variables.
    Never prints plain OTP or passwords.
    """
    env = (settings.ENVIRONMENT or "development").lower()
    
    # Check all naming fallbacks for SMTP Host
    smtp_host = os.environ.get("SMTP_HOST") or os.environ.get("MAIL_SERVER") or settings.SMTP_HOST
    
    # Check all naming fallbacks for SMTP Port
    port_val = os.environ.get("SMTP_PORT") or os.environ.get("MAIL_PORT") or settings.SMTP_PORT
    smtp_port = int(port_val) if port_val else None
    
    # Check all naming fallbacks for SMTP User
    smtp_user = os.environ.get("SMTP_USERNAME") or os.environ.get("MAIL_USERNAME") or os.environ.get("SMTP_USER") or settings.SMTP_USER
    
    # Check all naming fallbacks for SMTP Password
    smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("MAIL_PASSWORD") or settings.SMTP_PASSWORD
    
    # Check all naming fallbacks for SMTP From Email
    smtp_from = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("MAIL_FROM") or os.environ.get("SMTP_FROM") or settings.SMTP_FROM
    
    # Check SMTP TLS flag (default True)
    smtp_tls_val = os.environ.get("SMTP_TLS") or os.environ.get("MAIL_TLS") or "true"
    use_tls = smtp_tls_val.lower() == "true"

    smtp_configured = all([smtp_host, smtp_port, smtp_user, smtp_password, smtp_from])
    
    # Safe diagnostic logging (no credentials or values exposed)
    print(f"[SMTP DIAGNOSTIC] env: {env}")
    print(f"[SMTP DIAGNOSTIC] smtp_host_present: {bool(smtp_host)}")
    print(f"[SMTP DIAGNOSTIC] smtp_username_present: {bool(smtp_user)}")
    print(f"[SMTP DIAGNOSTIC] smtp_password_present: {bool(smtp_password)}")
    print(f"[SMTP DIAGNOSTIC] from_email_present: {bool(smtp_from)}")
    
    if not smtp_configured:
        if env == "production":
            raise Exception("SMTP email service is not configured in production environment.")
        else:
            # Development fallback
            try:
                app_dir = os.path.abspath(os.path.dirname(__file__))
                scratch_dir = os.path.abspath(os.path.join(app_dir, "..", "..", "..", "scratch"))
                if not os.path.exists(scratch_dir):
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
        # Dynamic salutation based on user role
        salutation = "Dear Student," if role == "student" else "Dear User,"
        signature = "Regards,\nStudent360 Team\nKarpagam College of Engineering"
        
        # Construct email message
        msg = MIMEText(
            f"{salutation}\n\n"
            f"Your Student360 password reset OTP is: {otp}\n\n"
            f"This OTP is valid for 10 minutes.\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"{signature}"
        )
        msg["Subject"] = "Student360 Password Reset OTP"
        msg["From"] = smtp_from
        msg["To"] = recipient_email
        
        # Connect to SMTP server
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        if use_tls:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"[EMAIL SERVICE] Successfully sent OTP email to {recipient_email}")
        return True
    except Exception as e:
        raise Exception(f"SMTP email transmission failed: {str(e)}")
