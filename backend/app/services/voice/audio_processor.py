import logging
import base64
import io
from typing import Optional
from pydub import AudioSegment

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Handles audio processing and format conversion without limits."""
    
    def __init__(self):
        # Simple defaults without config dependencies
        self.sample_rate = 16000  # Standard sample rate
        self.max_duration = 300   # 5 minutes max (OpenAI limit)
    
    async def prepare_audio_for_openai(self, audio_data: str) -> str:
        """Prepare audio data for OpenAI Whisper API."""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Try to load audio with pydub
            try:
                with io.BytesIO(audio_bytes) as audio_io:
                    audio_segment = AudioSegment.from_wav(audio_io)
            except:
                # Try other formats
                with io.BytesIO(audio_bytes) as audio_io:
                    audio_segment = AudioSegment.from_file(audio_io)
            
            # Convert to mono if stereo
            if audio_segment.channels > 1:
                audio_segment = audio_segment.set_channels(1)
            
            # Set sample rate
            audio_segment = audio_segment.set_frame_rate(self.sample_rate)
            
            # Check duration (OpenAI Whisper limit is 25MB, roughly 5 minutes)
            duration_seconds = len(audio_segment) / 1000
            if duration_seconds > self.max_duration:
                logger.warning(f"Audio duration {duration_seconds}s exceeds limit {self.max_duration}s")
                # Trim to max duration
                audio_segment = audio_segment[:self.max_duration * 1000]
            
            # Export as WAV
            output_io = io.BytesIO()
            audio_segment.export(output_io, format="wav")
            processed_audio = output_io.getvalue()
            
            # Re-encode as base64
            return base64.b64encode(processed_audio).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error preparing audio for OpenAI: {e}")
            raise ValueError(f"Unsupported audio format: {e}")
    
    async def validate_audio_format(self, audio_data: str) -> bool:
        """Validate audio format and size."""
        try:
            # Decode base64
            audio_bytes = base64.b64decode(audio_data)
            
            # Check file size (max 25MB for OpenAI)
            if len(audio_bytes) > 25 * 1024 * 1024:
                return False
            
            # Try to load with pydub to validate format
            with io.BytesIO(audio_bytes) as audio_io:
                AudioSegment.from_file(audio_io)
            
            return True
            
        except Exception:
            return False
    
    async def optimize_audio_quality(self, audio_data: str) -> str:
        """Optimize audio quality for better transcription."""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Load audio
            with io.BytesIO(audio_bytes) as audio_io:
                audio_segment = AudioSegment.from_file(audio_io)
            
            # Apply optimizations
            # Normalize volume
            audio_segment = audio_segment.normalize()
            
            # Export optimized audio
            output_io = io.BytesIO()
            audio_segment.export(output_io, format="wav")
            optimized_audio = output_io.getvalue()
            
            # Re-encode as base64
            return base64.b64encode(optimized_audio).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error optimizing audio: {e}")
            # Return original audio if optimization fails
            return audio_data
    
    async def get_audio_info(self, audio_data: str) -> dict:
        """Get information about audio data."""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Load audio
            with io.BytesIO(audio_bytes) as audio_io:
                audio_segment = AudioSegment.from_file(audio_io)
            
            return {
                "duration_ms": len(audio_segment),
                "duration_seconds": len(audio_segment) / 1000,
                "channels": audio_segment.channels,
                "sample_rate": audio_segment.frame_rate,
                "sample_width": audio_segment.sample_width,
                "file_size_bytes": len(audio_bytes)
            }
            
        except Exception as e:
            logger.error(f"Error getting audio info: {e}")
            return {}
    
    async def convert_audio_format(self, audio_data: str, target_format: str = "wav") -> str:
        """Convert audio to target format."""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Load audio
            with io.BytesIO(audio_bytes) as audio_io:
                audio_segment = AudioSegment.from_file(audio_io)
            
            # Export to target format
            output_io = io.BytesIO()
            audio_segment.export(output_io, format=target_format)
            converted_audio = output_io.getvalue()
            
            # Re-encode as base64
            return base64.b64encode(converted_audio).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error converting audio format: {e}")
            raise ValueError(f"Audio format conversion failed: {e}")
