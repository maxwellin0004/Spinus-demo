from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class ElevenLabsConfig:
    api_key: str = "47d9cf8e928207801b2c96a0e11ad8f4d4ef93d8aee4e0cb905e4cf6bc56950b"
    base_url: str = "https://api.elevenlabs.io/v1"
    default_voice_id: str = "fQj4gJSexpu8RDE2Ii5m"
    default_model_id: str = "eleven_v3"
    default_output_format: str = "mp3_44100_128"
    timeout_seconds: int = 180
    stability: float = 0.45
    similarity_boost: float = 0.8
    style: float = 0.2
    use_speaker_boost: bool = True
    speed: float = 1.0

    def headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["xi-api-key"] = self.api_key
        return headers

    def voice_settings(self) -> dict[str, object]:
        return {
            "stability": self.stability,
            "similarity_boost": self.similarity_boost,
            "style": self.style,
            "use_speaker_boost": self.use_speaker_boost,
            "speed": self.speed
        }

    def masked(self) -> dict[str, object]:
        payload = asdict(self)
        if self.api_key:
          payload["api_key"] = f"{self.api_key[:4]}***{self.api_key[-4:]}" if len(self.api_key) > 8 else "***"
        return payload


ELEVENLABS_CONFIG = ElevenLabsConfig()
