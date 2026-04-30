from pathlib import Path

from app.core.config import get_settings
from app.services.cv.template import ensure_template_shape


class CVExportService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def export_pdf(self, user_id: int, cv_id: int, title: str, cv_json: dict) -> str:
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except Exception as exc:
            raise RuntimeError("reportlab is not installed. Run `pip install reportlab`.") from exc

        output_dir = Path(self.settings.generated_assets_dir) / "pdf" / str(user_id)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"cv_{cv_id}.pdf"

        structured = ensure_template_shape(cv_json)
        c = canvas.Canvas(str(output_path), pagesize=A4)
        y = 800
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, structured["header"].get("name", title) or title)
        y -= 18
        c.setFont("Helvetica", 10)
        header_line = " | ".join(
            [
                str(structured["header"].get("email", "")).strip(),
                str(structured["header"].get("phone", "")).strip(),
                str(structured["header"].get("location", "")).strip(),
                str(structured["header"].get("linkedin", "")).strip(),
                str(structured["header"].get("github", "")).strip(),
            ]
        ).strip(" |")
        if header_line:
            c.drawString(50, y, header_line[:120])
            y -= 20

        for section in structured["section_order"]:
            content = structured["sections"].get(section)
            if content in (None, "", []):
                continue
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, section.replace("_", " ").title())
            y -= 16
            c.setFont("Helvetica", 10)

            if isinstance(content, str):
                lines = [content]
            elif isinstance(content, list):
                lines = [f"- {item}" for item in content]
            else:
                lines = [str(content)]

            for line in lines:
                for wrapped_line in str(line).splitlines():
                    c.drawString(60, y, wrapped_line[:115])
                    y -= 13
                    if y < 60:
                        c.showPage()
                        y = 800
            y -= 6
        c.save()
        return str(output_path)

    def export_docx(self, user_id: int, cv_id: int, title: str, cv_json: dict) -> str:
        try:
            from docx import Document
        except Exception as exc:
            raise RuntimeError("python-docx is not installed. Run `pip install python-docx`.") from exc

        output_dir = Path(self.settings.generated_assets_dir) / "docx" / str(user_id)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"cv_{cv_id}.docx"

        structured = ensure_template_shape(cv_json)
        doc = Document()
        doc.add_heading(structured["header"].get("name") or title, level=1)
        contact_line = " | ".join(
            [
                str(structured["header"].get("email", "")).strip(),
                str(structured["header"].get("phone", "")).strip(),
                str(structured["header"].get("location", "")).strip(),
                str(structured["header"].get("linkedin", "")).strip(),
                str(structured["header"].get("github", "")).strip(),
            ]
        ).strip(" |")
        if contact_line:
            doc.add_paragraph(contact_line)

        for section in structured["section_order"]:
            content = structured["sections"].get(section)
            if content in (None, "", []):
                continue
            doc.add_heading(section.replace("_", " ").title(), level=2)
            if isinstance(content, list):
                for item in content:
                    doc.add_paragraph(str(item), style="List Bullet")
            elif isinstance(content, str):
                doc.add_paragraph(content)
            else:
                doc.add_paragraph(str(content))
        doc.save(str(output_path))
        return str(output_path)
