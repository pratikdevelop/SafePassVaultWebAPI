from fastapi import APIRouter
from controllers.ticket_controller import TicketController

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("", response_model=dict)
async def create_ticket(data: dict):
    return await TicketController.create_ticket(data)

@router.get("", response_model=list)
async def get_all_tickets():
    return await TicketController.get_all_tickets()

@router.get("/{id}", response_model=dict)
async def get_ticket_by_id(id: str):
    return await TicketController.get_ticket_by_id(id)

@router.put("/{id}", response_model=dict)
async def update_ticket(id: str, data: dict):
    return await TicketController.update_ticket(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_ticket(id: str):
    return await TicketController.delete_ticket(id)