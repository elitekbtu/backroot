# app/services/voice/__init__.py
from __future__ import annotations
import azure.cognitiveservices.speech as speechsdk

class AzureSpeechService:
    """
    Thin wrapper around Azure Speech SDK for:
      - STT from an OGG/Opus byte stream (browser MediaRecorder)
      - TTS to MP3 bytes (Kazakh female voice by default)
    """

    def __init__(self, key: str, region: str, stt_locale: str, tts_voice: str):
        # One SpeechConfig is fine to share; we’ll create separate objects as needed.
        self._key = key
        self._region = region
        self._stt_locale = stt_locale
        self._tts_voice = tts_voice

        # Precreate a config for TTS (lets us set format & voice)
        self._tts_config = speechsdk.SpeechConfig(subscription=key, region=region)
        self._tts_config.speech_synthesis_voice_name = tts_voice
        # MP3 is easy to play in browsers
        self._tts_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )

    # -------- STT --------
    def stt_from_ogg_opus_bytes(self, audio_bytes: bytes) -> str:
        """
        Recognize speech from a single OGG/Opus chunk.
        If your client sends WAV/PCM instead, change the AudioStreamFormat creation below.
        """
        # Tell Azure we’re sending compressed OGG/Opus
        stream_format = speechsdk.audio.AudioStreamFormat(
            compressed_stream_format=speechsdk.audio.AudioStreamContainerFormat.OGG_OPUS
        )
        push_stream = speechsdk.audio.PushAudioInputStream(stream_format=stream_format)
        push_stream.write(audio_bytes)
        push_stream.close()

        stt_config = speechsdk.SpeechConfig(subscription=self._key, region=self._region)
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=stt_config,
            audio_config=speechsdk.audio.AudioConfig(stream=push_stream),
            language=self._stt_locale,
        )

        result = recognizer.recognize_once_async().get()
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text or ""
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return ""
        else:
            details = getattr(result, "cancellation_details", None)
            raise RuntimeError(
                f"STT failed: {getattr(details, 'reason', 'Unknown')} "
                f"- {getattr(details, 'error_details', '')}"
            )

    # -------- TTS --------
    def tts_to_mp3_bytes(self, text: str) -> bytes:
        """
        Synthesize text to MP3 bytes using the configured Kazakh voice.
        """
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self._tts_config,
            audio_config=speechsdk.audio.AudioOutputConfig(use_default_speaker=False),
        )
        result = synthesizer.speak_text_async(text).get()
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return result.audio_data
        else:
            details = getattr(result, "cancellation_details", None)
            raise RuntimeError(
                f"TTS failed: {getattr(details, 'reason', 'Unknown')} "
                f"- {getattr(details, 'error_details', '')}"
            )
