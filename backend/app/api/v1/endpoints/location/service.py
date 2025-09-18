import httpx
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import pytz
import logging

from .schema import (
    LocationContext, CityInfo, Attraction, TransportationInfo, 
    WeatherInfo, Coordinates, AttractionCategory, TransportationType,
    PriceRange
)

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self):
        self.openweather_api_key = "bbaa0df6b1acbcf11a8c13cbadc2ee1c"  # Same as weather service
        self.openweather_base_url = "https://api.openweathermap.org/data/2.5"
        
    async def get_city_from_coordinates(self, lat: float, lon: float) -> CityInfo:
        """Get city information from coordinates using reverse geocoding"""
        try:
            async with httpx.AsyncClient() as client:
                # Use a free reverse geocoding service
                response = await client.get(
                    f"https://api.bigdatacloud.net/data/reverse-geocode-client",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "localityLanguage": "en"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                return CityInfo(
                    name=data.get("city") or data.get("locality") or data.get("principalSubdivision") or "Unknown City",
                    country=data.get("countryName") or "Unknown Country",
                    country_code=data.get("countryCode") or "XX",
                    state=data.get("principalSubdivision"),
                    timezone=data.get("localityInfo", {}).get("administrative", [{}])[0].get("timezone") or "UTC",
                    population=data.get("population"),
                    coordinates=Coordinates(
                        lat=float(data.get("latitude", lat)),
                        lon=float(data.get("longitude", lon))
                    )
                )
        except Exception as e:
            logger.error(f"Failed to get city from coordinates: {e}")
            # Fallback to a default city
            return CityInfo(
                name="Unknown City",
                country="Unknown Country",
                country_code="XX",
                timezone="UTC",
                coordinates=Coordinates(lat=lat, lon=lon)
            )

    async def get_weather_info(self, lat: float, lon: float) -> Optional[WeatherInfo]:
        """Get current weather information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.openweather_base_url}/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.openweather_api_key,
                        "units": "metric",
                        "lang": "en"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                return WeatherInfo(
                    temperature=data["main"]["temp"],
                    description=data["weather"][0]["description"],
                    icon=data["weather"][0]["icon"]
                )
        except Exception as e:
            logger.error(f"Failed to get weather info: {e}")
            return None

    async def get_city_attractions(self, city_name: str, country_code: Optional[str] = None, limit: int = 10) -> List[Attraction]:
        """Get attractions for a city (mock implementation)"""
        # In a real implementation, you would use APIs like Foursquare, Google Places, etc.
        # For now, we'll return mock data based on the city
        mock_attractions = self._get_mock_attractions(city_name)
        return mock_attractions[:limit]

    async def get_city_transportation(self, city_name: str, limit: int = 10) -> List[TransportationInfo]:
        """Get transportation information for a city (mock implementation)"""
        # In a real implementation, you would use APIs like Google Maps, etc.
        mock_transportation = self._get_mock_transportation(city_name)
        return mock_transportation[:limit]

    async def get_location_context(
        self, 
        lat: float, 
        lon: float, 
        include_weather: bool = True,
        include_attractions: bool = True,
        include_transportation: bool = True
    ) -> LocationContext:
        """Get complete location context"""
        try:
            # Get city information
            city = await self.get_city_from_coordinates(lat, lon)
            
            # Get local time
            try:
                tz = pytz.timezone(city.timezone)
                local_time = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
            except:
                local_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Get additional information in parallel
            tasks = []
            
            if include_weather:
                tasks.append(self.get_weather_info(lat, lon))
            else:
                tasks.append(asyncio.create_task(asyncio.sleep(0)))
                
            if include_attractions:
                tasks.append(self.get_city_attractions(city.name, city.country_code))
            else:
                tasks.append(asyncio.create_task(asyncio.sleep(0)))
                
            if include_transportation:
                tasks.append(self.get_city_transportation(city.name))
            else:
                tasks.append(asyncio.create_task(asyncio.sleep(0)))
            
            # Wait for all tasks to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            weather = results[0] if include_weather and not isinstance(results[0], Exception) else None
            attractions = results[1] if include_attractions and not isinstance(results[1], Exception) else []
            transportation = results[2] if include_transportation and not isinstance(results[2], Exception) else []
            
            return LocationContext(
                city=city,
                attractions=attractions,
                transportation=transportation,
                weather=weather,
                local_time=local_time,
                timezone=city.timezone
            )
            
        except Exception as e:
            logger.error(f"Failed to get location context: {e}")
            raise

    def _get_mock_attractions(self, city_name: str) -> List[Attraction]:
        """Generate mock attractions for a city"""
        base_attractions = [
            {
                "id": "1",
                "name": "City Center",
                "description": "The heart of the city with shops, restaurants, and cultural sites",
                "category": AttractionCategory.LANDMARK,
                "rating": 4.5,
                "price_range": PriceRange.FREE
            },
            {
                "id": "2", 
                "name": "Local Museum",
                "description": "Explore the history and culture of the region",
                "category": AttractionCategory.MUSEUM,
                "rating": 4.2,
                "price_range": PriceRange.LOW
            },
            {
                "id": "3",
                "name": "Central Park",
                "description": "A beautiful green space perfect for relaxation",
                "category": AttractionCategory.PARK,
                "rating": 4.3,
                "price_range": PriceRange.FREE
            },
            {
                "id": "4",
                "name": "Historic District",
                "description": "Walk through centuries of history in this charming area",
                "category": AttractionCategory.HISTORICAL,
                "rating": 4.4,
                "price_range": PriceRange.FREE
            },
            {
                "id": "5",
                "name": "Art Gallery",
                "description": "Contemporary and classical art exhibitions",
                "category": AttractionCategory.MUSEUM,
                "rating": 4.1,
                "price_range": PriceRange.MEDIUM
            },
            {
                "id": "6",
                "name": "Local Market",
                "description": "Fresh produce, local crafts, and authentic cuisine",
                "category": AttractionCategory.SHOPPING,
                "rating": 4.0,
                "price_range": PriceRange.LOW
            }
        ]
        
        # Customize attractions based on city name
        attractions = []
        for i, attraction in enumerate(base_attractions):
            attractions.append(Attraction(
                id=f"{city_name.lower().replace(' ', '_')}_{attraction['id']}",
                name=f"{city_name} {attraction['name']}",
                description=attraction['description'],
                category=attraction['category'],
                rating=attraction['rating'],
                price_range=attraction['price_range']
            ))
        
        return attractions

    def _get_mock_transportation(self, city_name: str) -> List[TransportationInfo]:
        """Generate mock transportation options for a city"""
        return [
            TransportationInfo(
                type=TransportationType.METRO,
                name="Metro System",
                description="Fast and efficient underground transportation",
                estimated_time="5-15 minutes",
                estimated_cost="$2-5"
            ),
            TransportationInfo(
                type=TransportationType.BUS,
                name="City Bus",
                description="Comprehensive bus network covering the entire city",
                estimated_time="10-30 minutes",
                estimated_cost="$1-3"
            ),
            TransportationInfo(
                type=TransportationType.TAXI,
                name="Taxi Service",
                description="Convenient door-to-door service",
                estimated_time="5-20 minutes",
                estimated_cost="$10-25"
            ),
            TransportationInfo(
                type=TransportationType.WALKING,
                name="Walking",
                description="Explore the city on foot",
                estimated_time="10-45 minutes",
                estimated_cost="Free"
            ),
            TransportationInfo(
                type=TransportationType.BIKE,
                name="Bike Sharing",
                description="Eco-friendly way to get around the city",
                estimated_time="5-25 minutes",
                estimated_cost="$2-8"
            )
        ]

# Create singleton instance
location_service = LocationService()
