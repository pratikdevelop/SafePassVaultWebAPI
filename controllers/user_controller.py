from fastapi import HTTPException, UploadFile, File
from models import User, Organization  # Assuming Beanie models
from configuration import send_email, send_sms, s3, logger
from common import validate_user_registration, encrypt
from controllers.plan_controller import PlanController  # Placeholder
from typing import Dict, Optional, Any
import os
from dotenv import load_dotenv
import jwt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64
import secrets
import bcrypt
from datetime import datetime, timedelta
import pyotp
import qrcode
from io import BytesIO
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticationCredential,
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialUserEntity,
)

load_dotenv()

class UserController:
    @staticmethod
    async def create_user(data: Dict[str, str]) -> Dict[str, Any]:
        """Register a new user and send a verification email."""
        is_valid, errors = await validate_user_registration(data)
        if not is_valid:
            raise HTTPException(status_code=400, detail=errors)

        email, password, name, phone = data["email"], data["password"], data["name"], data["phone"]
        address = data.get("address")
        city = data.get("city")
        state = data.get("state")
        postal_code = data.get("postalCode")
        country = data.get("country")

        # Hash password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)

        # Create trial user
        trial_user = User(
            email=email,
            password=hashed_password.decode('utf-8'),
            name=name,
            phone=phone,
            address=address,
            city=city,
            state=state,
            postal_code=postal_code,
            country=country,
        )

        # Create organization
        organization = Organization(name=f"{name}'s Organization", owner_id=trial_user.id)
        trial_user.organization_ids = [organization.id]

        # Generate confirmation code
        confirmation_code = str(secrets.randbelow(900000) + 100000)
        trial_user.confirmation_code = confirmation_code

        # Send verification email
        mail_options = {
            "from": "safepassvault@gmail.com",
            "to": email,
            "subject": "Your SafePassVault Verification Code",
            "body": (
                f"<b>Hello {name},</b>"
                f"<p>Thank you for registering with SafePassVault. To complete your registration, please use the following verification code:</p>"
                f"<p style='font-size: 18px; font-weight: bold; color: #333;'>{confirmation_code}</p>"
                f"<p>Enter this code in the required field to confirm your account. This code will expire shortly, so please use it promptly.</p>"
                f"<p>If you did not request this code or have Any questions, please contact our support team at "
                f"<a href='mailto:safepassvault@gmail.com'>safepassvault@gmail.com</a>.</p>"
                f"<p>Thanks,<br>The SafePassVault Team</p>"
            ),
        }
        await send_email(**mail_options)

        # Save user and organization
        await trial_user.insert()
        await organization.insert()

        return {"userId": str(trial_user.id), "message": f"User created successfully. A verification email has been sent to {email}."}

    @staticmethod
    async def add_private_and_public_key(data: Dict[str, str]) -> Dict[str, Any]:
        """Generate and store RSA key pair for a user."""
        email, passphrase = data["email"], data["passphrase"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate RSA key pair
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048, backend=default_backend())
        public_key = private_key.public_key()

        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        # Encrypt passphrase with public key
        encrypted_passphrase = public_key.encrypt(
            passphrase.encode('utf-8'),
            padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
        )
        # Sign passphrase
        signature = private_key.sign(
            passphrase.encode('utf-8'),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )

        # Update user
        user.public_key = public_key_pem
        user.passphrase = base64.b64encode(encrypted_passphrase).decode('utf-8')
        user.fingerprint = base64.b64encode(signature).decode('utf-8')
        await user.save()

        return {"message": "Public and private key added successfully", "publicKeyPEM": public_key_pem, "privateKeyPEM": private_key_pem}

    @staticmethod
    async def upload_file(file: UploadFile = File(...)) -> Dict[str, Any]:
        """Upload a file to S3 and update user image."""
        user = await User.find_one(User.id == ...)  # Add auth dependency to get user ID
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        params = {
            "Bucket": os.getenv("S3_BUCKET_NAME_FILE_STORAGE"),
            "Key": f"uploads/{int(datetime.now().timestamp())}_{file.filename}",
            "Body": await file.read(),
            "ContentType": file.content_type,
        }
        result = await s3.upload(params)
        user.user_image = result["Location"]
        await user.save()

        return {"message": "File uploaded and user image updated successfully", "url": result["Location"], "user": user.dict()}

    @staticmethod
    async def confirm_email(data: Dict[str, str]) -> Dict[str, str]:
        """Confirm user email with a code."""
        email, confirmation_code = data["email"], data["confirmationCode"]
        user = await User.find_one(User.email == email)
        if not user or user.confirmation_code != confirmation_code:
            raise HTTPException(status_code=400, detail="Invalid email or confirmation code")

        user.email_confirmed = True
        user.confirmation_code = None
        await user.save()

        token = jwt.encode({"id": str(user.id)}, os.getenv("SECRET_KEY"), algorithm="HS256")
        return {"message": "Email confirmed successfully", "token": token}

    @staticmethod
    async def get_profile(user_id: str) -> Dict[str, Any]:
        """Retrieve user profile and plan details."""
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        plan_details = await PlanController.get_plan_details(user_id)
        return {"user": user.dict(), "planDetails": plan_details}

    @staticmethod
    async def update_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile with allowed fields."""
        allowed_updates = {"name", "email", "address", "state", "phone", "postalCode", "city", "country"}
        if not all(key in allowed_updates for key in data):
            raise HTTPException(status_code=400, detail="Invalid updates!")

        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        for key, value in data.items():
            setattr(user, key, value)
        await user.save()
        return user.dict()

    @staticmethod
    async def delete_profile(user_id: str) -> Dict[str, str]:
        """Delete user account."""
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await user.delete()
        return {"message": "User deleted successfully"}

    @staticmethod
    async def initiate_recovery(data: Dict[str, str]) -> Dict[str, str]:
        """Initiate password reset or account recovery."""
        email = data["email"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User email not found")

        reset_token = secrets.token_hex(32)
        reset_token_expiry = datetime.now() + timedelta(minutes=10)
        user.reset_token = reset_token
        user.reset_token_expiry = reset_token_expiry
        await user.save()

        reset_link = f"{os.getenv('FRONTEND_URL')}/auth/change-password?token={base64.urlsafe_b64encode(f'{user.id}:{reset_token}'.encode()).decode()}"
        mail_options = {
            "from": "safepassvault@gmail.com",
            "to": email,
            "subject": "SafePassVault Password Reset Request",
            "body": (
                f"<b>Hi {user.name},</b>"
                f"<p>We received a request to reset your password for your SafePassVault account. To proceed with resetting your password, please click the link below:</p>"
                f"<p><a href='{reset_link}' style='font-size: 16px; color: #4CAF50; text-decoration: none;'>Reset Password</a></p>"
                f"<p>This link is valid for 10 minutes. After that, you will need to request a new password reset link if needed.</p>"
                f"<p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>"
                f"<p>Thank you,<br>The SafePassVault Team</p>"
            ),
        }
        await send_email(**mail_options)

        return {"message": "Password reset link sent successfully", "userId": str(user.id)}

    @staticmethod
    async def verify_reset_link(token: str, email: str) -> Dict[str, Any]:
        """Verify password reset link."""
        try:
            payload = base64.urlsafe_b64decode(token.encode()).decode()
            user_id, reset_token = payload.split(":")
        except:
            raise HTTPException(status_code=400, detail="Missing user ID or reset token")

        user = await User.find_one(User.id == user_id)
        if not user or user.reset_token != reset_token or user.reset_token_expiry < datetime.now():
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")

        return {"verified": True, "message": "Reset link verified. You can now reset your password."}

    @staticmethod
    async def logout(user_id: str) -> Dict[str, str]:
        """Log out user by clearing tokens."""
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.tokens = []
        await user.save()
        return {"message": "Successfully logged out"}

    @staticmethod
    async def change_password(param: str, data: Dict[str, str]) -> Dict[str, str]:
        """Change user password."""
        confirm_password, password = data["confirmPassword"], data["password"]
        if confirm_password != password:
            raise HTTPException(status_code=400, detail="Passwords do not match")

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        user = await User.find_one(User.email == param if "@" in param else User.id == param)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.password = hashed_password
        await user.save()
        return {"message": "Password changed successfully"}

    @staticmethod
    async def save_mfa_settings(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save MFA settings for a user."""
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        mfa_enabled, mfa_method, totp_secret, security_pin = (
            data["mfaEnabled"], data["mfaMethod"], data.get("totpSecret"), data.get("securityPin")
        )
        if user.mfa_method == mfa_method:
            raise HTTPException(status_code=400, detail="MFA method already set")

        user.mfa_enabled = mfa_enabled
        user.mfa_method = mfa_method

        if mfa_method == "totp" and totp_secret:
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(totp_secret):
                raise HTTPException(status_code=400, detail="Invalid TOTP token")
        elif mfa_method == "webauthn":
            user.security_pin = security_pin

        await user.save()
        return {"success": True, "message": f"MFA settings updated successfully for {mfa_method}"}

    @staticmethod
    async def verify_mfa_code(data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify MFA code during login."""
        email, mfa_code, method, totp_code = (
            data["email"], data.get("mfaCode"), data["method"], data.get("totpCode")
        )
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if method in ("sms", "email"):
            if user.mfa_code != mfa_code or user.mfa_code_expiry < datetime.now():
                raise HTTPException(status_code=400, detail="Invalid or expired MFA code")
            user.mfa_code = None
            user.mfa_code_expiry = None
            await user.save()
        elif method == "totp":
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(totp_code):
                raise HTTPException(status_code=400, detail="Invalid TOTP token")

        token = jwt.encode({"id": str(user.id)}, os.getenv("SECRET_KEY"), algorithm="HS256")
        return {"token": token, "message": "MFA code verified successfully", "success": True}

    @staticmethod
    async def login_user(data: Dict[str, str]) -> Dict[str, Any]:
        """Handle user login with MFA support."""
        username, password = data["username"], data["password"]
        user = await User.find_one(User.email == username)
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        if user.mfa_enabled:
            mfa_code = str(secrets.randbelow(900000) + 100000)
            user.mfa_code = mfa_code
            user.mfa_code_expiry = datetime.now() + timedelta(minutes=5)
            await user.save()

            if user.mfa_method == "email":
                mail_options = {
                    "from": "safepassvault@gmail.com",
                    "to": user.email,
                    "subject": "Your Multi-Factor Authentication (MFA) Code",
                    "body": (
                        f"<b>Hi {user.name},</b>"
                        f"<p>We received a request to access your SafePassVault account. Please use the following MFA code:</p>"
                        f"<span style='font-size: 2rem; font-weight: bold; color: #333;'>{mfa_code}</span>"
                        f"<p>This code will expire in 5 minutes.</p>"
                        f"<p>Contact <a href='mailto:safepassvault@gmail.com'>support</a> if this wasn’t you.</p>"
                    ),
                }
                await send_email(**mail_options)
                return {"message": "MFA code sent via email", "mfaRequired": True, "mfaMethod": user.mfa_method}
            elif user.mfa_method == "sms":
                await send_sms(mfa_code, user.phone)
                return {"message": "MFA code sent via SMS", "userId": str(user.id), "mfaRequired": True, "mfaMethod": user.mfa_method}
            elif user.mfa_method == "totp":
                return {"message": "TOTP MFA enabled", "userId": str(user.id), "mfaRequired": True, "mfaMethod": user.mfa_method}
            elif user.mfa_method == "webauthn":
                options = generate_authentication_options(
                    rp_id="localhost",  # Replace with your domain in production
                )
                user.webauthn_challenge = options.challenge  # Store challenge for later verification
                await user.save()
                return {
                    "message": "WebAuthn challenge required",
                    "mfaRequired": True,
                    "mfaMethod": "webauthn",
                    "challenge": options.challenge,
                    "options": options.dict()
                }
            else:
                raise HTTPException(status_code=400, detail="Unsupported MFA method")

        token = jwt.encode({"id": str(user.id)}, os.getenv("SECRET_KEY"), algorithm="HS256")
        return {"token": token}

    @staticmethod
    async def resend_confirmation_code(email: str) -> Dict[str, str]:
        """Resend email confirmation code."""
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        confirmation_code = str(secrets.randbelow(900000) + 100000)
        user.confirmation_code = confirmation_code
        await user.save()

        mail_options = {
            "from": "safepassvault@gmail.com",
            "to": email,
            "subject": "Your SafePassVault Verification Code",
            "body": (
                f"<b>Hi {user.name},</b>"
                f"<p>Here’s your new verification code:</p>"
                f"<p style='font-size: 18px; font-weight: bold; color: #333;'>{confirmation_code}</p>"
                f"<p>Use it to confirm your account. It expires soon.</p>"
                f"<p>Contact <a href='mailto:safepassvault@gmail.com'>support</a> if needed.</p>"
            ),
        }
        await send_email(**mail_options)
        return {"message": "Resend Email Confirmation code sent to your mail"}

    @staticmethod
    async def send_magic_link(data: Dict[str, str]) -> Dict[str, str]:
        """Send a magic link for passwordless login."""
        email = data["email"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        token = jwt.encode({"email": email, "exp": datetime.utcnow() + timedelta(minutes=10)}, os.getenv("EMAIL_SECRET"), algorithm="HS256")
        magic_link = f"{os.getenv('FRONTEND_URL')}/auth/magic-link?token={token}"
        await send_email(
            email,
            "Your SafePassVault Magic Link",
            f"<p>Click the link below to log in:</p><a href='{magic_link}'>Login to SafePassVault</a>"
        )
        return {"message": "Magic link sent to your email."}

    @staticmethod
    async def verify_magic_link(token: str, email: str) -> Dict[str, Any]:
        """Verify magic link and log in user."""
        try:
            decoded = jwt.decode(token, os.getenv("EMAIL_SECRET"), algorithms=["HS256"])
            user = await User.find_one(User.email == decoded["email"])
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            session_token = jwt.encode({"id": str(user.id)}, os.getenv("SECRET_KEY"), algorithm="HS256")
            return {"token": session_token, "message": "Login successful"}
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="Invalid or expired magic link")

    @staticmethod
    async def initiate_recovery(data: Dict[str, str]) -> Dict[str, Any]:
        """Initiate account recovery with a token."""
        email = data["email"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        recovery_token = secrets.token_hex(32)
        user.recovery_token = base64.b64encode(hashes.Hash(hashes.SHA256()).update(recovery_token.encode()).finalize()).decode()
        user.recovery_token_expiry = datetime.now() + timedelta(minutes=15)
        await user.save()

        mail_options = {
            "from": "safepassvault@gmail.com",
            "to": email,
            "subject": "Account Recovery - SafePassVault",
            "body": (
                f"<p>Hello,</p>"
                f"<p>We received a request to recover your SafePassVault account.</p>"
                f"<p>Use the following recovery token to proceed:</p>"
                f"<p style='font-weight: bold; font-size: 18px;'>{recovery_token}</p>"
                f"<p>This token is valid for 15 minutes.</p>"
            ),
        }
        await send_email(**mail_options)
        return {"message": "Recovery email sent.", "recoveryToken": recovery_token}

    @staticmethod
    async def verify_recovery(data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify recovery token and passphrase."""
        email, recovery_token, encrypted_recovery_phrase, private_key_pem = (
            data["email"], data["recoveryToken"], data["encryptedRecoveryPhrase"], data["privateKeyPEM"]
        )
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_token = base64.b64encode(hashes.Hash(hashes.SHA256()).update(recovery_token.encode()).finalize()).decode()
        if user.recovery_token != hashed_token or user.recovery_token_expiry < datetime.now():
            raise HTTPException(status_code=400, detail="Invalid or expired recovery token")

        private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None, backend=default_backend())
        public_key = serialization.load_pem_public_key(user.public_key.encode(), backend=default_backend())
        decrypted_phrase = private_key.decrypt(
            base64.b64decode(encrypted_recovery_phrase),
            padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
        )
        try:
            public_key.verify(
                base64.b64decode(user.fingerprint),
                decrypted_phrase,
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA256()
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Recovery phrase verification failed")

        return {"message": "Recovery verified successfully.", "passphrase": decrypted_phrase.decode()}

    @staticmethod
    async def setup_2fa(data: Dict[str, str]) -> Dict[str, str]:
        """Set up TOTP 2FA and return QR code."""
        email = data["email"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        secret = pyotp.random_base32()
        user.totp_secret = secret
        await user.save()

        otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="SafePassVault")
        qr = qrcode.make(otpauth_url)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        image_url = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
        return {"imageUrl": image_url}

    @staticmethod
    async def verify_2fa(data: Dict[str, str]) -> Dict[str, str]:
        """Verify TOTP code."""
        email, token = data["email"], data["token"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(token):
            raise HTTPException(status_code=400, detail="Invalid token")
        return {"message": "2FA verified successfully"}

    @staticmethod
    async def create_web_auth_registration(user_id: str) -> Dict[str, Any]:
        """Initiate WebAuthn registration."""
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        options = generate_registration_options(
            rp=PublicKeyCredentialRpEntity(id="localhost", name="SafePassVault"),
            user=PublicKeyCredentialUserEntity(
                id=user_id.encode(),  # User ID as bytes
                name=user.email,
                display_name=user.name,
            ),
            challenge=base64url_to_bytes(secrets.token_urlsafe(32)),  # Random challenge
        )
        user.webauthn_challenge = options.challenge  # Store as bytes
        await user.save()

        return {"challenge": options.challenge.decode('utf-8'), "options": options.dict()}

    @staticmethod
    async def complete_web_auth_registration(user_id: str, data: Dict[str, Any]) -> Dict[str, str]:
        """Complete WebAuthn registration."""
        credential = RegistrationCredential.parse_obj(data["credential"])
        user = await User.find_one(User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        verification = verify_registration_response(
            credential=credential,
            expected_challenge=user.webauthn_challenge,
            expected_origin="https://localhost",  # Adjust for production
            expected_rp_id="localhost",  # Adjust for production
        )

        # Store WebAuthn credentials
        user.webauthn_client_id = verification.credential_id.decode('utf-8')  # Store as string
        user.webauthn_public_key = verification.credential_public_key.decode('utf-8')  # Store as string
        user.sign_count = verification.sign_count  # Initial sign count
        await user.save()

        return {"status": "Registration complete"}

    @staticmethod
    async def complete_web_authn_authentication(data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete WebAuthn authentication."""
        credential = AuthenticationCredential.parse_obj(data["credential"])
        challenge = base64url_to_bytes(data["challenge"])
        email = data["email"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        result = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin="https://localhost",  # Adjust for production
            expected_rp_id="localhost",  # Adjust for production
            credential_public_key=base64url_to_bytes(user.webauthn_public_key),
            credential_current_sign_count=user.sign_count if user.sign_count is not None else 0,
        )

        # Update sign count to prevent replay attacks
        user.sign_count = result.new_sign_count
        await user.save()

        token = jwt.encode({"id": str(user.id)}, os.getenv("SECRET_KEY"), algorithm="HS256")
        return {"message": "MFA authentication successful", "token": token}

    @staticmethod
    async def verify_security_pin(data: Dict[str, Any]) -> Dict[str, str]:
        """Verify security PIN."""
        email, security_pin = data["email"], data["securityPin"]
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.security_pin != security_pin:
            raise HTTPException(status_code=401, detail="Invalid PIN")
        return {"message": "PIN verified successfully"}