# Location-Aware V2V AI Guide

## Overview

The V2V (Voice-to-Voice) AI system now includes comprehensive location awareness capabilities, allowing the AI to act as a knowledgeable local guide that understands where the user is located and can provide location-specific recommendations, directions, and information.

## Features

### 🌍 Location Detection
- **Automatic GPS Detection**: Automatically detects user's current location using browser geolocation API
- **City Identification**: Converts coordinates to city, country, and timezone information
- **Permission Handling**: Graceful handling of location permission requests and denials

### 🏛️ Local Information
- **City Context**: Provides detailed information about the user's current city
- **Attractions**: Lists popular local attractions, museums, parks, and points of interest
- **Transportation**: Information about local transportation options (metro, bus, taxi, walking, etc.)
- **Weather Integration**: Current weather conditions for the location
- **Local Time**: Accurate local time and timezone information

### 🤖 AI Guide Capabilities
- **Location-Aware Responses**: AI understands where the user is and provides relevant local advice
- **Tourist Recommendations**: Suggests places to visit, eat, and activities based on location
- **Transportation Guidance**: Provides directions and transportation options
- **Cultural Insights**: Shares local customs, culture, and practical tips
- **Weather Information**: Discusses current weather and seasonal conditions

## Technical Implementation

### Frontend Components

#### Location Service (`/frontend/src/api/location.ts`)
- Handles geolocation API interactions
- Reverse geocoding to determine city from coordinates
- Fetches local attractions and transportation information
- Manages location permissions and error handling

#### V2V Component Updates (`/frontend/src/pages/V2V.tsx`)
- Integrated location state management
- Real-time location tracking
- Location-aware UI components
- Error handling and fallback mechanisms

### Backend API

#### Location Endpoints (`/backend/app/api/v1/endpoints/location/`)
- **POST `/location/context`**: Get complete location context including city, attractions, transportation, and weather
- **GET/POST `/location/attractions`**: Get attractions for a specific city
- **GET/POST `/location/transportation`**: Get transportation options for a city
- **GET `/location/health`**: Health check endpoint

#### V2V Service Integration (`/backend/app/services/voice/v2v_service.py`)
- Location context storage in user sessions
- Location-aware AI prompts
- Dynamic system prompts based on user location
- Integration with OpenAI and Groq clients

## Usage

### For Users

1. **Grant Location Permission**: When prompted, allow the browser to access your location
2. **Automatic Detection**: The system will automatically detect your city and load local information
3. **Ask Location Questions**: Ask the AI about:
   - "What should I do here?"
   - "Where can I eat nearby?"
   - "How do I get to [place]?"
   - "What's the weather like?"
   - "Tell me about local attractions"

### For Developers

#### Frontend Integration
```typescript
import { locationService } from '../api/location';

// Get current location
const location = await locationService.getCurrentLocation();

// Get full location context
const context = await locationService.getLocationContext(location);

// Send to AI
v2vService.sendLocationContext(context);
```

#### Backend Integration
```python
# Location context is automatically included in user sessions
location_context = user_sessions[user_id].get("location_context")

# AI prompts are automatically location-aware
ai_response = await generate_response(
    user_input, 
    user_id, 
    user_sessions, 
    custom_system_prompt=get_location_aware_prompt(user_id)
)
```

## Configuration

### Environment Variables
- `OPENWEATHER_API_KEY`: For weather information (already configured)
- No additional environment variables required for basic functionality

### Location Settings
```typescript
const locationSettings = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
  watchLocation: false,
  autoUpdateContext: true
};
```

## Error Handling

### Graceful Degradation
- **Permission Denied**: Falls back to generic location context
- **GPS Unavailable**: Uses approximate location or default context
- **API Failures**: Continues with available information
- **Network Issues**: Caches last known location

### User Feedback
- Clear permission request messages
- Status indicators for location services
- Error messages with actionable solutions
- Fallback options when location is unavailable

## Privacy & Security

### Data Handling
- Location data is only stored in user session (not persisted)
- No location data is logged or stored permanently
- All location requests are made client-side
- Reverse geocoding uses free, privacy-focused services

### Permission Management
- Users can revoke location access at any time
- Clear indication when location services are active
- Option to manually refresh location data
- No tracking or analytics on location data

## Future Enhancements

### Planned Features
- **Offline Mode**: Cache location data for offline use
- **Location History**: Remember frequently visited places
- **Custom Locations**: Allow users to set custom locations
- **Advanced Recommendations**: ML-based personalized suggestions
- **Real-time Updates**: Live location tracking with automatic updates

### API Integrations
- **Google Places API**: Enhanced attraction and business information
- **Foursquare API**: More detailed local recommendations
- **Uber/Lyft API**: Real-time transportation options
- **Event APIs**: Local events and activities

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Check browser settings
   - Ensure HTTPS connection
   - Try refreshing the page

2. **Inaccurate Location**
   - Enable high accuracy mode
   - Check GPS settings
   - Try in a different location

3. **No Local Information**
   - Check internet connection
   - Verify API keys are configured
   - Try refreshing location data

### Debug Mode
Enable console logging to see detailed location information:
```javascript
// In browser console
localStorage.setItem('debug', 'location');
```

## Support

For technical support or feature requests related to location functionality, please refer to the main project documentation or create an issue in the project repository.
