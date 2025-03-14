from fastapi import HTTPException, status
from models import Card, User, SharedItem, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional,Any
from datetime import datetime
from pydantic import BaseModel

class CardController:
    @staticmethod
    async def create_card(user_id: str, folder_id: Optional[str], card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new card and log the action."""
        try:
            if not folder_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder ID is required")

            card_data["userId"] = user_id
            card_data["expiryDate"] = datetime.now()
            card_data["folder"] = folder_id

            new_card = Card(**card_data)
            await new_card.save()

            # Log the card creation
            audit_log = AuditLog(
                userId=user_id,
                action="create",
                entity="cards",
                entityId=new_card.id,
                newValue=new_card.dict(),
                ipAddress="0.0.0.0",  # Replace with actual IP from request
                userAgent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return new_card.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    async def get_all_cards(
        user_id: str,
        page: int = 1,
        limit: int = 10,
        sort: str = "cardType",
        order: str = "asc",
        search: Optional[str] = None,
        folder_id: Optional[str] = None,
        filter: str = "all",
    ) -> Dict[str, Any]:
        """Retrieve all cards with optional filtering, sorting, and pagination."""
        try:
            sort_option = {sort: 1 if order == "asc" else -1}
            search_query = {}

            if search and search != "undefined":
                search_query["$or"] = [
                    {"cardType": {"$regex": search, "$options": "i"}},
                    {"cardHolderName": {"$regex": search, "$options": "i"}},
                    {"billingAddress": {"$regex": search, "$options": "i"}},
                ]

            query = {"userId": user_id, **search_query}

            if folder_id:
                query["folder"] = folder_id

            user = await User.find_one(User.id == user_id)
            shared_items = []

            # Filter logic
            if filter == "favourite":
                query["_id"] = {"$in": user.favorites}
            elif filter == "shared_with_me":
                shared_items = await SharedItem.find({"itemType": "card", "sharedWith.userId": user_id}).to_list()
                shared_card_ids = [item.itemId for item in shared_items]
                query["_id"] = {"$in": shared_card_ids}
            elif filter == "created_by_me":
                query["created_by"] = user_id
            else:  # "all" or default
                shared_items = await SharedItem.find({"itemType": "card", "sharedWith.userId": user_id}).to_list()
                shared_card_ids = [item.itemId for item in shared_items]
                query["$or"] = [{"userId": user_id}]
                if shared_card_ids:
                    query["$or"].append({"_id": {"$in": shared_card_ids}})

            # Execute the query with sorting, pagination
            cards = await Card.find(query).sort(sort_option).skip((page - 1) * limit).limit(limit).to_list()
            total_count = await Card.count_documents(query)

            # Log the card retrieval
            audit_log = AuditLog(
                userId=user_id,
                action="fetch",
                entity="cards",
                entityId=None,
                newValue={"query": query, "results": len(cards)},
                ipAddress="0.0.0.0",  # Replace with actual IP from request
                userAgent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {
                "cards": [card.dict() for card in cards],
                "pagination": {
                    "totalCount": total_count,
                    "totalPages": (total_count + limit - 1) // limit,
                    "currentPage": page,
                    "pageSize": limit,
                },
            }
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def update_card(user_id: str, card_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a card and log the action."""
        allowed_updates = ["cardType", "cardNumber", "cardHolderName", "expiryDate", "CVV"]
        invalid_updates = [key for key in updates.keys() if key not in allowed_updates]

        if invalid_updates:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid updates: {invalid_updates}")

        try:
            card = await Card.find_one(Card.id == card_id)
            if not card:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

            old_card = card.dict()
            for key, value in updates.items():
                setattr(card, key, value)
            await card.save()

            # Log the card update
            audit_log = AuditLog(
                userId=user_id,
                action="update",
                entity="cards",
                entityId=card.id,
                oldValue=old_card,
                newValue=card.dict(),
                ipAddress="0.0.0.0",  # Replace with actual IP from request
                userAgent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return card.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    async def delete_card(user_id: str, card_id: str) -> Dict[str, Any]:
        """Delete a card and log the action."""
        try:
            card = await Card.find_one(Card.id == card_id)
            if not card:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

            await card.delete()

            # Log the card deletion
            audit_log = AuditLog(
                userId=user_id,
                action="delete",
                entity="cards",
                entityId=card.id,
                oldValue=card.dict(),
                newValue=None,
                ipAddress="0.0.0.0",  # Replace with actual IP from request
                userAgent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "Card deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def toggle_favorite(user_id: str, card_ids: List[str]) -> Dict[str, Any]:
        """Toggle favorite status for cards and log the action."""
        try:
            user = await User.find_one(User.id == user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            updated_favorites = []
            for card_id in card_ids:
                card = await Card.find_one(Card.id == card_id)
                if not card:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Card with ID {card_id} not found")

                if card_id in user.favorites:
                    user.favorites.remove(card_id)
                else:
                    user.favorites.append(card_id)
                updated_favorites.append(card_id)

            await user.save()

            # Log the favorite toggle action
            audit_log = AuditLog(
                userId=user_id,
                action="toggle_favorite",
                entity="cards",
                entityId=updated_favorites,
                newValue=user.favorites,
                ipAddress="0.0.0.0",  # Replace with actual IP from request
                userAgent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "Favorites updated successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))