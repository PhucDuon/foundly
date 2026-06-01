from pydantic import BaseModel


class IdeaCreate(BaseModel):
    name: str
    description: str
    category: str
    stage: str = "Idea"
    looking_for: list[str] = []
