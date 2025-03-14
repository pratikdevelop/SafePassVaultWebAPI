from fastapi import APIRouter
from controllers.invitation_controller import InvitationController

router = APIRouter(prefix="/invitations", tags=["Invitations"])

@router.post("/{organization_id}/invitations", response_model=dict)
async def send_invitation(organization_id: str, data: dict):
    """Send an invitation to join an organization."""
    return await InvitationController.send_invitation(organization_id, data)

@router.post("/accept-invitation", response_model=dict)
async def accept_invitation(data: dict):
    """Accept an invitation to join an organization."""
    return await InvitationController.accept_invitation(data)

@router.get("/users", response_model=list)
async def get_all_users():
    """Retrieve a list of all users."""
    return await InvitationController.get_all_users()

@router.post("/resend-invitation/{organization_id}/{recipient_id}", response_model=dict)
async def resend_invitation(organization_id: str, recipient_id: str):
    """Resend an invitation to join an organization."""
    return await InvitationController.resend_invitation(organization_id, recipient_id)