ROLE_EMOJI: dict[str, str] = {
    "Developer": "🧑‍💻",
    "Designer": "🎨",
    "Product Manager": "📋",
    "Marketer": "📈",
    "Business Analyst": "💼",
    "Other": "🚀",
}


def role_to_emoji(role: str) -> str:
    return ROLE_EMOJI.get(role, "🚀")


def compute_compatibility(me: dict, other: dict) -> int:
    """
    Score 0–100:
      - Shared interests : 0–40 pts  (same vision)
      - Skill complement : 0–25 pts  (fills your gaps)
      - Role diversity   : 20 pts    (complementary co-founders)
      - Experience match : 0–15 pts  (similar level)
    """
    score = 0

    my_interests = set(me.get("interests") or [])
    other_interests = set(other.get("interests") or [])
    union = my_interests | other_interests
    if union:
        score += int((len(my_interests & other_interests) / len(union)) * 40)

    my_skills = set(me.get("skills") or [])
    other_skills = set(other.get("skills") or [])
    score += min(len(other_skills - my_skills) * 3, 25)

    if me.get("role") and other.get("role") and me["role"] != other["role"]:
        score += 20

    exp_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
    my_exp = exp_map.get(me.get("experience_level", ""), 2)
    other_exp = exp_map.get(other.get("experience_level", ""), 2)
    score += max(15 - abs(my_exp - other_exp) * 5, 0)

    return min(score, 100)
