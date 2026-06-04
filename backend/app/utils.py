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


ROLE_COMPLEMENT_SCORES: dict[frozenset, int] = {
    frozenset(["Developer", "Designer"]):         25,
    frozenset(["Developer", "Marketer"]):         23,
    frozenset(["Developer", "Product Manager"]):  23,
    frozenset(["Developer", "Business Analyst"]): 18,
    frozenset(["Designer", "Marketer"]):          22,
    frozenset(["Designer", "Product Manager"]):   20,
    frozenset(["Product Manager", "Marketer"]):   22,
    frozenset(["Product Manager", "Business Analyst"]): 18,
    frozenset(["Marketer", "Business Analyst"]):  16,
}


def compute_compatibility(me: dict, other: dict) -> int:
    """
    Score 0–100:
      - Interest alignment  : 0–30 pts  (shared domain vision, Jaccard-normalised)
      - Skill complement    : 0–25 pts  (they fill your gaps, proportion-normalised)
      - Role complementarity: 0–25 pts  (co-founder pair quality matrix)
      - Experience proximity: 0–10 pts  (similar stage of career)
      - Location bonus      : 0–10 pts  (same city → easier to work together)
    """
    score = 0

    # 1. Interest alignment (Jaccard, max 30)
    my_interests = set(me.get("interests") or [])
    other_interests = set(other.get("interests") or [])
    union = my_interests | other_interests
    if union:
        score += int((len(my_interests & other_interests) / len(union)) * 30)

    # 2. Skill complement — proportion of their skills you don't have (max 25)
    my_skills = set(me.get("skills") or [])
    other_skills = set(other.get("skills") or [])
    if other_skills:
        complement_ratio = len(other_skills - my_skills) / len(other_skills)
        score += int(complement_ratio * 25)

    # 3. Role complementarity matrix (max 25; same role = 5; unknown pair = 12)
    my_role = me.get("role", "")
    other_role = other.get("role", "")
    if my_role and other_role:
        if my_role == other_role:
            score += 5
        else:
            pair = frozenset([my_role, other_role])
            score += ROLE_COMPLEMENT_SCORES.get(pair, 12)

    # 4. Experience proximity (max 10; 1-level gap = 7, 2-level gap = 3)
    exp_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
    my_exp = exp_map.get(me.get("experience_level", ""), 2)
    other_exp = exp_map.get(other.get("experience_level", ""), 2)
    exp_pts = [10, 7, 3]
    score += exp_pts[min(abs(my_exp - other_exp), 2)]

    # 5. Location bonus (max 10; case-insensitive, strip whitespace)
    my_loc = (me.get("location") or "").strip().lower()
    other_loc = (other.get("location") or "").strip().lower()
    if my_loc and other_loc and my_loc == other_loc:
        score += 10

    return min(score, 100)
