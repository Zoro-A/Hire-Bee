from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireBee API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str
    access_token_expire_minutes: int = 60
    database_url: str | None = None
    db_driver: str = "postgresql+psycopg2"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str | None = None
    db_user: str | None = None
    db_password: str | None = None
    auto_create_database: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    resume_storage_dir: str = "storage/resumes"
    parsing_confidence_threshold: float = 0.55
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    # Chat for conversational CV: "openai" (uses OPENAI_*) or "ollama" (local OSS, uses OLLAMA_*).
    conversation_llm_provider: str = "openai"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_chat_model: str = "llama3.2:1b"
    # Passed to Ollama /api/chat "options". Smaller num_ctx lowers RAM/VRAM use (helps "runner terminated" on Windows).
    ollama_chat_num_ctx: int = 4096
    ollama_chat_num_predict: int = 512
    # If set (e.g. 0), sent as num_gpu. Use 0 to force CPU when GPU drivers or VRAM cause the llama runner to crash.
    ollama_chat_num_gpu: int | None = None
    # CV JSON from transcript: "openai" now; later wire "qwen_local" to your fine-tuned endpoint.
    cv_json_llm_provider: str = "openai"
    qwen_local_adapter_path: str | None = None
    qwen_local_base_model: str = "Qwen/Qwen2.5-3B-Instruct"
    qwen_local_device: str = "auto"
    qwen_local_max_new_tokens: int = 1400
    qwen_local_temperature: float = 0.15
    conversation_history_limit: int = 80
    conversation_history_store_limit: int = 300
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = "job_skills"
    embedding_model_name: str = "BAAI/bge-small-en-v1.5"
    embedding_vector_size: int = 384
    matching_score_threshold: float = 0.45
    matching_top_k: int = 8
    qdrant_safe_upsert: bool = True
    generated_assets_dir: str = "storage/generated"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
    google_client_id: str | None = None
    frontend_base_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @model_validator(mode="after")
    def assemble_database_url(self) -> "Settings":
        if self.database_url:
            return self

        missing = [
            key
            for key, value in {
                "DB_NAME": self.db_name,
                "DB_USER": self.db_user,
                "DB_PASSWORD": self.db_password,
            }.items()
            if not value
        ]
        if missing:
            missing_text = ", ".join(missing)
            raise ValueError(
                "Provide DATABASE_URL or set DB_NAME, DB_USER, DB_PASSWORD. "
                f"Missing: {missing_text}"
            )

        encoded_password = quote_plus(self.db_password or "")
        self.database_url = (
            f"{self.db_driver}://{self.db_user}:{encoded_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
