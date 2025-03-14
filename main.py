from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from dotenv import load_dotenv
import os
from configuration import init_mongo_client, mongo_client, logger
from routes import (
    address_routes, audit_routes, card_routes, file_routes, folder_routes,
    invitation_routes, log_routes, note_routes, organization_routes, password_routes,
    plan_routes, proof_id_routes, secret_routes, security_question_routes, share_item_routes,
    sso_settings_routes, tag_routes, ticket_routes, user_routes
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="SafePass Vault API",
    version="1.0.0",
    description="API for managing passwords, notes, and more with security features",
    docs_url="/api/swagger",
)

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost:4200",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# # Rate limiting
# limiter = Limiter(key_func=get_remote_address)
# app.state.limiter = limiter
# # app.add_middleware(limiter)

# Custom middleware for security headers (Helmet equivalent)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; connect-src 'self' http://localhost:3000 "
            "https://vixol72czg.execute-api.us-east-1.amazonaws.com; "
            "script-src 'self' 'unsafe-inline' https://vixol72czg.execute-api.us-east-1.amazonaws.com; "
            "style-src 'self' 'unsafe-inline' https://vixol72czg.execute-api.us-east-1.amazonaws.com; "
            "img-src 'self' https://vixol72czg.execute-api.us-east-1.amazonaws.com; "
            "font-src 'self' https://fonts.gstatic.com;"
        )
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Hello World"}

# Include routes with prefixes
app.include_router(address_routes.router, prefix="/api/addresses")
app.include_router(folder_routes.router, prefix="/api/folders")
app.include_router(user_routes.router, prefix="/api/auth")
app.include_router(password_routes.router, prefix="/api/passwords")
app.include_router(tag_routes.router, prefix="/api/tags")
app.include_router(note_routes.router, prefix="/api/notes")
app.include_router(proof_id_routes.router, prefix="/api/proofIds")
app.include_router(card_routes.router, prefix="/api/cards")
app.include_router(security_question_routes.router, prefix="/api/security-questions")
app.include_router(file_routes.router, prefix="/api/files")
app.include_router(share_item_routes.router, prefix="/api/share")
app.include_router(plan_routes.router, prefix="/api/plans")
app.include_router(log_routes.router, prefix="/api/logs")
app.include_router(secret_routes.router, prefix="/api/secrets")
app.include_router(audit_routes.router, prefix="/api/audit")
app.include_router(invitation_routes.router, prefix="/api/invitation")
app.include_router(organization_routes.router, prefix="/api/organization")
app.include_router(sso_settings_routes.router, prefix="/api/sso-settings")
app.include_router(ticket_routes.router, prefix="/api/tickets")

# Startup event to initialize MongoDB
@app.on_event("startup")
async def startup_event():
    global mongo_client
    mongo_client = await init_mongo_client()
    logger.info(f"Server started on port {os.getenv('PORT', 8000)}")

# Run the app (for standalone execution)
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)