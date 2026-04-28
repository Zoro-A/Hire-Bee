from pathlib import Path

def extract_pdf_text(file_path: Path) -> str:
    try:
        import fitz
    except Exception as exc:
        raise RuntimeError("PyMuPDF is not installed. Run `pip install PyMuPDF`.") from exc
    text_parts: list[str] = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_parts.append(page.get_text("text"))
    return "\n".join(text_parts).strip()


def extract_docx_text(file_path: Path) -> str:
    try:
        import docx
    except Exception as exc:
        raise RuntimeError("python-docx is not installed. Run `pip install python-docx`.") from exc
    document = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in document.paragraphs]).strip()


def extract_text(file_path: Path) -> str:
    extension = file_path.suffix.lower()
    if extension == ".pdf":
        return extract_pdf_text(file_path)
    if extension == ".docx":
        return extract_docx_text(file_path)
    raise ValueError("Unsupported file type. Only PDF and DOCX are allowed.")
