#!/usr/bin/env python3
"""
Test script for Kazakh language support in V2V service
"""

import asyncio
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.voice.v2v_service import V2VWebSocketService

async def test_kazakh_language():
    """Test Kazakh language support in V2V service"""
    
    print("🧪 Testing Kazakh language support in V2V service...")
    
    # Initialize the service
    service = V2VWebSocketService()
    
    # Test text in Kazakh
    test_texts = [
        "Сәлем! Қалайсыз?",
        "Менің атым Айша.",
        "Алматы қаласы өте әдемі.",
        "Рақмет сізге көмектескеніңіз үшін!",
        "Бүгін ауа-райы жақсы."
    ]
    
    print("\n📝 Testing Kazakh text processing:")
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n{i}. Text: {text}")
        
        # Test phoneme generation
        phonemes = service._text_to_phonemes_enhanced(text)
        print(f"   Phonemes: {phonemes}")
        
        # Test lip sync data generation
        lip_sync_data = await service.generate_lip_sync_data(text)
        print(f"   Language: {lip_sync_data['language']}")
        print(f"   Duration: {lip_sync_data['duration']:.2f}s")
        print(f"   Visemes count: {len(lip_sync_data['visemes'])}")
        
        # Test system prompt
        prompt = service._get_location_aware_prompt("test_user")
        print(f"   System prompt contains Kazakh: {'қазақ тілі' in prompt}")
    
    print("\n✅ Kazakh language test completed!")
    
    # Test mixed language (Kazakh + English)
    print("\n🌍 Testing mixed language support:")
    mixed_text = "Hello! Сәлем! How are you? Қалайсыз?"
    print(f"Mixed text: {mixed_text}")
    
    phonemes = service._text_to_phonemes_enhanced(mixed_text)
    print(f"Phonemes: {phonemes}")
    
    lip_sync_data = await service.generate_lip_sync_data(mixed_text)
    print(f"Language: {lip_sync_data['language']}")
    print(f"Duration: {lip_sync_data['duration']:.2f}s")

if __name__ == "__main__":
    asyncio.run(test_kazakh_language())
