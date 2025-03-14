from fastapi import APIRouter
from models import Log  # Assuming a Log model exists

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/", response_model=list)
async def get_logs():
    logs = await Log.find().sort("-timestamp").limit(100).to_list()
    return logs