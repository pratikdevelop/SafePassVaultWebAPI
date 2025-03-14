from fastapi import APIRouter, UploadFile, File
from controllers.user_controller import UserController

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=dict, status_code=201)
async def create_user(data: dict):
    """Register a new user."""
    return await UserController.create_user(data)

@router.post("/confirm-email", response_model=dict)
async def confirm_email(data: dict):
    """Confirm user email."""
    return await UserController.confirm_email(data)

@router.post("/login", response_model=dict)
async def login_user(data: dict):
    """User login."""
    return await UserController.login_user(data)

@router.post("/logout", response_model=dict)
async def logout():
    """User logout."""
    return await UserController.logout()

@router.get("/profile", response_model=dict)
async def get_profile():
    """Retrieve user profile."""
    return await UserController.get_profile()

@router.patch("/profile", response_model=dict)
async def update_profile(data: dict):
    """Update user profile."""
    return await UserController.update_profile(data)

@router.delete("/profile", response_model=dict)
async def delete_profile():
    """Delete user profile."""
    return await UserController.delete_profile()

@router.post("/reset-password", response_model=dict)
async def initiate_recovery(data: dict):
    """Send reset password email."""
    return await UserController.initiate_recovery(data)

@router.patch("/change-password/{param}", response_model=dict)
async def change_password(param: str, data: dict):
    """Change user password."""
    return await UserController.change_password(param, data)

@router.get("/verify-reset-link", response_model=dict)
async def verify_reset_link(token: str, email: str):
    """Verify reset password link."""
    return await UserController.verify_reset_link(token, email)

@router.post("/mfa-settings", response_model=dict)
async def save_mfa_settings(data: dict):
    """Save MFA settings."""
    return await UserController.save_mfa_settings(data)

@router.post("/verify-mfa", response_model=dict)
async def verify_mfa_code(data: dict):
    """Verify MFA code."""
    return await UserController.verify_mfa_code(data)

@router.get("/resend-code/{email}", response_model=dict)
async def resend_confirmation_code(email: str):
    """Resend confirmation code."""
    return await UserController.resend_confirmation_code(email)

@router.post("/upload", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    """Upload user file."""
    return await UserController.upload_file(file)

@router.post("/setup-2fa", response_model=dict)
async def setup_2fa(data: dict):
    return await UserController.setup_2fa(data)

@router.post("/request-magic-link", response_model=dict)
async def send_magic_link(data: dict):
    return await UserController.send_magic_link(data)

@router.post("/verify-2fa", response_model=dict)
async def verify_2fa(data: dict):
    return await UserController.verify_2fa(data)

@router.get("/magic-link", response_model=dict)
async def verify_magic_link(token: str, email: str):
    return await UserController.verify_magic_link(token, email)

@router.post("/recover-account", response_model=dict)
async def initiate_recovery(data: dict):
    return await UserController.initiate_recovery(data)

@router.post("/recovery-verify", response_model=dict)
async def verify_recovery(data: dict):
    return await UserController.verify_recovery(data)

@router.post("/generate-private-key", response_model=dict)
async def add_private_and_public_key(data: dict):
    return await UserController.add_private_and_public_key(data)

@router.get("/completeWebAuthRegisteration", response_model=dict)
async def create_web_auth_registration():
    return await UserController.create_web_auth_registration()

@router.post("/complete-webauth-register", response_model=dict)
async def complete_web_auth_registration(data: dict):
    return await UserController.complete_web_auth_registration(data)

@router.post("/webauthn/complete-authenticate", response_model=dict)
async def complete_web_authn_authentication(data: dict):
    return await UserController.complete_web_authn_authentication(data)

@router.post("/verify-security-pin", response_model=dict)
async def verify_security_pin(data: dict):
    return await UserController.verify_security_pin(data)