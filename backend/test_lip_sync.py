#!/usr/bin/env python3
"""
Test script for lip-sync functionality
"""

import asyncio
import json
from app.services.voice.v2v_service import V2VWebSocketService

async def test_lip_sync():
    """Test lip-sync data generation"""
    
    # Create service instance
    service = V2VWebSocketService()
    
    # Test texts
    test_texts = [
        "Hello, how are you today?",
        "This is a test of the lip sync functionality.",
        "The quick brown fox jumps over the lazy dog.",
        "Artificial intelligence is transforming our world.",
        "Welcome to the future of voice communication!"
    ]
    
    print("🧪 Testing Lip-Sync Generation")
    print("=" * 50)
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n📝 Test {i}: {text}")
        print("-" * 40)
        
        try:
            # Generate lip-sync data
            lip_sync_data = await service.generate_lip_sync_data(text)
            
            # Print results
            print(f"✅ Success!")
            print(f"   Duration: {lip_sync_data['duration']:.2f}s")
            print(f"   Phonemes: {len(lip_sync_data['visemes'])}")
            print(f"   Language: {lip_sync_data['language']}")
            
            # Show first few phonemes with timing
            print(f"   Sample timing:")
            for j, timing in enumerate(lip_sync_data['timing'][:5]):
                print(f"     {j+1}. {timing['phoneme']}: {timing['start_time']:.3f}s - {timing['duration']:.3f}s")
            
            if len(lip_sync_data['timing']) > 5:
                print(f"     ... and {len(lip_sync_data['timing']) - 5} more")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 Lip-Sync Testing Complete!")

async def test_phoneme_mapping():
    """Test phoneme mapping functionality"""
    
    service = V2VWebSocketService()
    
    print("\n🔤 Testing Phoneme Mapping")
    print("=" * 50)
    
    # Test individual phonemes
    test_chars = "abcdefghijklmnopqrstuvwxyz"
    
    for char in test_chars:
        phonemes = service._text_to_phonemes_enhanced(char)
        print(f"'{char}' -> {phonemes}")
    
    # Test special combinations
    special_tests = [
        "sh", "ch", "th", "ng", "ph", "wh"
    ]
    
    print(f"\n🔍 Special combinations:")
    for combo in special_tests:
        phonemes = service._text_to_phonemes_enhanced(combo)
        print(f"'{combo}' -> {phonemes}")

async def test_duration_calculation():
    """Test speech duration calculation"""
    
    service = V2VWebSocketService()
    
    print("\n⏱️ Testing Duration Calculation")
    print("=" * 50)
    
    test_cases = [
        ("Hello", 1),
        ("Hello world", 2),
        ("This is a longer sentence with more words.", 5),
        ("Supercalifragilisticexpialidocious", 1),
        ("A", 1),
        ("", 0)
    ]
    
    for text, expected_words in test_cases:
        try:
            duration = service._calculate_speech_duration(text, len(text.split()))
            print(f"'{text}' -> {duration:.2f}s (expected ~{expected_words * 0.4:.1f}s)")
        except Exception as e:
            print(f"'{text}' -> Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Lip-Sync Tests...")
    
    # Run tests
    asyncio.run(test_lip_sync())
    asyncio.run(test_phoneme_mapping())
    asyncio.run(test_duration_calculation())
    
    print("\n✨ All tests completed!")
