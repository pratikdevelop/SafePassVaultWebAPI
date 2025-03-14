import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import binascii
from typing import Dict, Tuple, Optional, Any
from fastapi import HTTPException
from pydantic import EmailStr
from models import User  # Assuming your User model is in models.py
from webauthn import verify_authentication_response, base64url_to_bytes
from webauthn.helpers import decode_credential_public_key
from webauthn.helpers.structs import PublicKeyCredentialHint
import logging
import re

# Setup logging
logger = logging.getLogger(__name__)

# Encryption Utility
def encrypt(text: str, password: str) -> str:
    """
    Encrypts text using AES-256-CBC with a given password.

    Args:
        text: The plaintext to encrypt.
        password: The encryption key (expected as a hex string, 32 bytes).

    Returns:
        A string in the format 'iv:encrypted_data' (both hex-encoded).
    """
    try:
        # Ensure password is 32 bytes (256 bits) for AES-256
        key = binascii.unhexlify(password)
        if len(key) != 32:
            raise ValueError("Password must be a 32-byte hex string for AES-256")

        # Generate a random 16-byte IV
        iv = os.urandom(16)

        # Create cipher and encrypt
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        # Pad text to multiple of 16 bytes (PKCS#7 padding)
        padding_length = 16 - (len(text) % 16)
        padded_text = text + (chr(padding_length) * padding_length)

        encrypted = encryptor.update(padded_text.encode('utf-8')) + encryptor.finalize()
        return f"{binascii.hexlify(iv).decode('utf-8')}:{binascii.hexlify(encrypted).decode('utf-8')}"
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        raise HTTPException(status_code=500, detail="Encryption failed")

# User Registration Validation
async def validate_user_registration(data: Dict[str, str]) -> Tuple[bool, Dict[str, str]]:
    """
    Validates user registration input fields.

    Args:
        data: Dictionary containing email, password, name, and phone.

    Returns:
        Tuple of (is_valid: bool, errors: dict) indicating validation result.
    """
    errors = {}

    # Extract fields
    email: Optional[EmailStr] = data.get("email")
    password: Optional[str] = data.get("password")
    name: Optional[str] = data.get("name")
    phone: Optional[str] = data.get("phone")

    # Check for missing fields
    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."
    if not name:
        errors["name"] = "Name is required."
    if not phone:
        errors["phone"] = "Phone number is required."

    # Email format validation
    if email and not isinstance(email, EmailStr):
        try:
            EmailStr.validate(email)
        except ValueError:
            errors["email"] = "Invalid email format."

    # Phone number validation (10 digits)
    if phone and (not phone.isdigit() or len(phone) != 10):
        errors["phone"] = "Phone number must be 10 digits."

    # Password strength validation
    password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$"
    if password and not re.match(password_pattern, password):
        errors["password"] = (
            "Password must be at least 8 characters long and contain "
            "numbers, letters (upper and lower), and special characters."
        )

    # Check if email already exists
    if email and "email" not in errors:
        existing_user = await User.find_one(User.email == email)
        if existing_user:
            errors["email"] = "Email is already registered."

    return (len(errors) == 0, errors)

# WebAuthn Response Verification
async def verify_webauthn_response(
    user: User,
    credential: Dict[str, Any],
    challenge: str,
) -> bool:
    """
    Verifies a WebAuthn authentication response using the webauthn library.

    Args:
        user: The User model instance from the database.
        credential: The WebAuthn assertion response from the client.
        challenge: The original challenge sent to the client.

    Returns:
        bool: Whether the WebAuthn response is valid.
    """
    try:
        # Check if user has WebAuthn credentials set up
        if not user.web_authn_client_id or not user.web_authn_public_key:
            logger.warning(f"User {user.email} does not have WebAuthn credentials set up")
            return False

        # Prepare expected values
        expected_challenge = base64url_to_bytes(challenge)
        expected_origin = "https://localhost"  # Replace with your domain in production
        expected_rp_id = "localhost"  # Replace with your RP ID in production

        # Decode the stored public key (assumed Base64URL-encoded)
        credential_public_key = decode_credential_public_key(
            base64url_to_bytes(user.web_authn_public_key)
        )

        # Parse the credential response from the client
        auth_response = PublicKeyCredentialHint.parse_obj(credential)

        # Verify the authentication response
        verification = verify_authentication_response(
            credential=auth_response,
            expected_challenge=expected_challenge,
            expected_origin=expected_origin,
            expected_rp_id=expected_rp_id,
            credential_public_key=credential_public_key,
            credential_current_sign_count=0,  # Replace with user.sign_count if tracking
        )

        if verification:
            # Optionally update sign_count if tracking it
            # Example: user.sign_count = verification.new_sign_count
            await user.save()
            logger.info(f"WebAuthn verification successful for user: {user.email}")
            return True
        else:
            logger.warning("WebAuthn verification failed")
            return False

    except Exception as e:
        logger.error(f"Error verifying WebAuthn response: {e}")
        return False

# Export equivalent
__all__ = [
    "encrypt",
    "validate_user_registration",
    "verify_webauthn_response",
]