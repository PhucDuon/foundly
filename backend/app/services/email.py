import httpx
from app.config import settings

RESEND_URL = "https://api.resend.com/emails"


async def send_report_email(
    reporter_email: str,
    reported_email: str,
    reported_id: str,
    reason: str,
):
    if not settings.RESEND_API_KEY or not settings.ADMIN_EMAIL:
        return

    reason_label = reason.replace("_", " ").title()

    html = f"""
    <h2>🚩 New Report on Foundly</h2>
    <table>
      <tr><td><b>Reporter</b></td><td>{reporter_email}</td></tr>
      <tr><td><b>Reported user</b></td><td>{reported_email} (<code>{reported_id}</code>)</td></tr>
      <tr><td><b>Reason</b></td><td>{reason_label}</td></tr>
    </table>
    <p>Review in <a href="https://supabase.com/dashboard/project/sqbwsrayjhxigcalpmhi/auth/users">Supabase Auth Users</a>.</p>
    """

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                RESEND_URL,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": "Foundly Reports <onboarding@resend.dev>",
                    "to": settings.ADMIN_EMAIL,
                    "subject": f"🚩 Report: {reason_label} — {reported_email}",
                    "html": html,
                },
            )
    except Exception as e:
        print(f"[email] report notification failed: {e}")
