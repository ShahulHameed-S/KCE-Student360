import os
import smtplib
import socket
import httpx
from email.mime.text import MIMEText
from app.config import settings

def send_otp_email(recipient_email: str, otp: str, role: str = "student") -> bool:
    """
    Sends an OTP email to the recipient.
    Supports EMAIL_PROVIDER=resend and EMAIL_PROVIDER=smtp.
    Falls back to Resend if RESEND_API_KEY is defined, otherwise SMTP.
    Never prints plain OTP or passwords.
    """
    env = (settings.ENVIRONMENT or "development").lower()
    
    # 1. Determine active provider
    email_provider = os.environ.get("EMAIL_PROVIDER")
    if not email_provider:
        email_provider = getattr(settings, "EMAIL_PROVIDER", None)
        
    resend_key = os.environ.get("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None)
    
    if not email_provider:
        if resend_key:
            email_provider = "resend"
        else:
            email_provider = "smtp"
            
    email_provider = email_provider.lower().strip()
    
    # 2. Resend API Flow
    if email_provider == "resend":
        from_email = os.environ.get("RESEND_FROM_EMAIL") or getattr(settings, "RESEND_FROM_EMAIL", "onboarding@resend.dev")
        from_name = os.environ.get("RESEND_FROM_NAME") or getattr(settings, "RESEND_FROM_NAME", "Student360")
        
        # Diagnostics log
        print(f"[EMAIL SERVICE - DIAGNOSTIC] provider: resend")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] resend_api_key_present: {bool(resend_key)}")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] resend_from_email_present: {bool(from_email)}")
        
        if env == "development" and not resend_key:
            # Development fallback write to file if Resend key is missing locally
            return write_dev_otp_fallback(recipient_email, otp)
            
        if not resend_key:
            raise Exception("ResendAPIError: RESEND_API_KEY is not configured.")
            
        try:
            salutation = "Dear Student," if role == "student" else "Dear User,"
            signature = "Regards,<br>Student360 Team<br>Karpagam College of Engineering"
            
            html_content = (
                f"<p>{salutation}</p>"
                f"<p>Your Student360 password reset OTP is: <b>{otp}</b></p>"
                f"<p>This OTP is valid for 10 minutes.</p>"
                f"<p>If you did not request this, please ignore this email.</p>"
                f"<p>{signature}</p>"
            )
            
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": f"{from_name} <{from_email}>",
                "to": [recipient_email],
                "subject": "Student360 Password Reset OTP",
                "html": html_content
            }
            
            response = httpx.post(
                "https://api.resend.com/emails",
                json=payload,
                headers=headers,
                timeout=15.0
            )
            
            if response.status_code in [200, 201, 202]:
                print(f"[EMAIL SERVICE - RESEND] Successfully sent OTP email to {recipient_email}")
                return True
            else:
                err_detail = response.text
                raise Exception(f"ResendAPIError: API call failed with status code {response.status_code}. Detail: {err_detail}")
        except httpx.TimeoutException:
            raise Exception("TimeoutError: Email service timed out. Please try again later.")
        except Exception as e:
            err_msg = str(e)
            if "timeout" in err_msg.lower():
                raise Exception("TimeoutError: Email service timed out. Please try again later.")
            raise Exception(f"ResendAPIError: {err_msg}")
            
    # 3. SMTP Flow
    else:
        smtp_host = os.environ.get("SMTP_HOST") or os.environ.get("MAIL_SERVER") or settings.SMTP_HOST
        port_val = os.environ.get("SMTP_PORT") or os.environ.get("MAIL_PORT") or settings.SMTP_PORT
        smtp_port = int(port_val) if port_val else None
        smtp_user = os.environ.get("SMTP_USERNAME") or os.environ.get("MAIL_USERNAME") or os.environ.get("SMTP_USER") or settings.SMTP_USER
        smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("MAIL_PASSWORD") or settings.SMTP_PASSWORD
        smtp_from = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("MAIL_FROM") or os.environ.get("SMTP_FROM") or settings.SMTP_FROM
        
        smtp_tls_val = os.environ.get("SMTP_TLS") or os.environ.get("MAIL_TLS") or "true"
        use_tls = smtp_tls_val.lower() == "true"
        smtp_ssl_val = os.environ.get("SMTP_SSL") or os.environ.get("MAIL_SSL") or "false"
        use_ssl = smtp_ssl_val.lower() == "true"

        smtp_configured = all([smtp_host, smtp_port, smtp_user, smtp_password, smtp_from])
        
        print(f"[EMAIL SERVICE - DIAGNOSTIC] provider: smtp")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] smtp_host_present: {bool(smtp_host)}")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] smtp_username_present: {bool(smtp_user)}")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] smtp_password_present: {bool(smtp_password)}")
        print(f"[EMAIL SERVICE - DIAGNOSTIC] from_email_present: {bool(smtp_from)}")
        
        if not smtp_configured:
            if env == "production":
                raise Exception("SMTP email service is not configured in production environment.")
            else:
                return write_dev_otp_fallback(recipient_email, otp)
                    
        try:
            salutation = "Dear Student," if role == "student" else "Dear User,"
            signature = "Regards,\nStudent360 Team\nKarpagam College of Engineering"
            
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
            
            if use_ssl or smtp_port == 465:
                server_class = smtplib.SMTP_SSL
            else:
                server_class = smtplib.SMTP

            with server_class(smtp_host, int(smtp_port), timeout=15) as server:
                if not (use_ssl or smtp_port == 465) and use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
                
            print(f"[EMAIL SERVICE] Successfully sent OTP email to {recipient_email}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            raise Exception("SMTPAuthenticationError: Email authentication failed. Please check SMTP credentials.")
        except (smtplib.SMTPConnectError, socket.timeout, TimeoutError) as e:
            raise Exception("TimeoutError: Email service timed out. Please try again later.")
        except smtplib.SMTPServerDisconnected as e:
            raise Exception("SMTPServerDisconnected: Email service disconnected. Please contact admin.")
        except Exception as e:
            err_msg = str(e)
            if "timeout" in err_msg.lower() or "timed out" in err_msg.lower():
                raise Exception("TimeoutError: Email service timed out. Please try again later.")
            raise Exception(f"SMTP email transmission failed: {err_msg}")

def write_dev_otp_fallback(recipient_email: str, otp: str) -> bool:
    try:
        app_dir = os.path.abspath(os.path.dirname(__file__))
        scratch_dir = os.path.abspath(os.path.join(app_dir, "..", "..", "..", "scratch"))
        if not os.path.exists(scratch_dir):
            scratch_dir = os.path.abspath(os.path.join(app_dir, "..", "..", "scratch"))
        os.makedirs(scratch_dir, exist_ok=True)
        
        filepath = os.path.join(scratch_dir, "last_otp.txt")
        with open(filepath, "w") as f:
            f.write(f"Recipient: {recipient_email}\nOTP: {otp}\n")
        
        print(f"[EMAIL FALLBACK] Dev OTP fallback written to {filepath}")
        return True
    except Exception as e:
        raise Exception(f"Failed to write dev OTP to scratch file: {str(e)}")
