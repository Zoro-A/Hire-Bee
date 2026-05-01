from email.message import EmailMessage
from pathlib import Path
import smtplib

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import Email


class SMTPEmailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def send_email(
        self,
        db: Session,
        recipient: str,
        subject: str,
        body: str,
        attachment_paths: list[str] | None = None,
    ) -> Email:
        sender = self.settings.smtp_from_email or self.settings.smtp_username or "noreply@hirebee.local"
        email_log = Email(
            sender=sender,
            recipient=recipient,
            subject=subject,
            body=body,
            status="queued",
            provider="smtp",
        )
        db.add(email_log)
        db.flush()

        try:
            self._send_via_smtp(sender, recipient, subject, body, attachment_paths or [])
            email_log.status = "sent"
        except Exception as exc:
            email_log.status = f"failed: {exc}"

        db.commit()
        db.refresh(email_log)
        return email_log

    def _send_via_smtp(
        self,
        sender: str,
        recipient: str,
        subject: str,
        body: str,
        attachment_paths: list[str],
    ) -> None:
        if not self.settings.smtp_username or not self.settings.smtp_password:
            raise RuntimeError("SMTP credentials are missing in environment settings.")

        message = EmailMessage()
        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        for path in attachment_paths:
            file_path = Path(path)
            if not file_path.exists() or not file_path.is_file():
                continue
            data = file_path.read_bytes()
            subtype = "pdf" if file_path.suffix.lower() == ".pdf" else "octet-stream"
            message.add_attachment(
                data,
                maintype="application",
                subtype=subtype,
                filename=file_path.name,
            )

        with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=30) as server:
            if self.settings.smtp_use_tls:
                server.starttls()
            server.login(self.settings.smtp_username, self.settings.smtp_password)
            server.send_message(message)
