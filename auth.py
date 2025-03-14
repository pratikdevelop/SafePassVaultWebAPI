from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Define public routes that don’t require authentication
PUBLIC_ROUTES = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/confirm-email",
    "/api/auth/resend-code/{email}",
    "/api/auth/recovery-verify",
    "/api/logs",
    "/api/auth/reset-password",
    "/api/auth/verify-reset-link",
    "/api/auth/change-password/{param}",
    "/api/plans",
    "/api/auth/verify-mfa",
    "/api/swagger",
    "/api/auth/request-magic-link",
    "/api/auth/magic-link",
    "/api/invitation/accept-invitation",
    "/api/auth/recover-account",
    "/api/passwords/download/{filename}",
    "/api/auth/webauthn/complete-authenticate",
    "/api/auth/verify-security-pin",
}

# HTTP Bearer token scheme
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), request: Request = None) -> dict:
    """
    Authentication dependency to verify JWT tokens.

    Args:
        credentials: Bearer token from the Authorization header.
        request: The incoming request object.

    Returns:
        Decoded JWT payload if valid.

    Raises:
        HTTPException: If token is missing, invalid, or authentication fails.
    """
    # Skip authentication for public routes
    if any(route in request.url.path for route in PUBLIC_ROUTES):
        return None

    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No token provided")

    try:
        # Verify JWT token
        decoded = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
        return decoded
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# Example usage in a route
# @router.get("/protected", dependencies=[Depends(get_current_user)])
# async def protected_route(user: dict = Depends(get_current_user)):
#     return {"user": user}