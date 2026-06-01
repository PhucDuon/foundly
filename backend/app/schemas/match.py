from pydantic import BaseModel
from typing import Literal


class SwipeRequest(BaseModel):
    swiped_id: str
    direction: Literal["left", "right"]


class SwipeResponse(BaseModel):
    matched: bool
    match: dict | None = None
