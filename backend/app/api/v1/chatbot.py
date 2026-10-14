from fastapi import APIRouter
from app.schemas.schemas import ChatMessagePayload, ChatResponse
from app.services.awareness_service import get_bloodbuddy_response

router = APIRouter(prefix="/awareness-chat", tags=["BloodBuddy Awareness Chatbot"])

@router.post("/message", response_model=ChatResponse)
def send_chat_message(payload: ChatMessagePayload):
    response = get_bloodbuddy_response(payload.message, payload.language or "en")
    return response

@router.get("/suggestions")
def get_chat_suggestions():
    return [
        "Does donating blood cause weakness or fatigue?",
        "How long do I need to wait after getting a tattoo?",
        "What are the general donor eligibility criteria in India?",
        "Does blood donation hurt?",
        "How often can I donate blood or platelets?",
        "How does BloodLink coordinate emergency requests?"
    ]

