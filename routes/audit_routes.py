from fastapi import APIRouter
from controllers.audit_controller import AuditLogController

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/", response_model=list)
async def get_user_audit_logs():
    return await AuditLogController.get_user_audit_logs()