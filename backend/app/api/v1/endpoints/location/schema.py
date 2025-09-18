from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AttractionCategory(str, Enum):
    LANDMARK = "landmark"
    MUSEUM = "museum"
    PARK = "park"
    RESTAURANT = "restaurant"
    SHOPPING = "shopping"
    ENTERTAINMENT = "entertainment"
    RELIGIOUS = "religious"
    HISTORICAL = "historical"
    NATURE = "nature"
    OTHER = "other"

class PriceRange(str, Enum):
    FREE = "free"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TransportationType(str, Enum):
    METRO = "metro"
    BUS = "bus"
    TAXI = "taxi"
    WALKING = "walking"
    CAR = "car"
    BIKE = "bike"
    OTHER = "other"

class Coordinates(BaseModel):
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")

class CityInfo(BaseModel):
    name: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")
    country_code: str = Field(..., description="Country code")
    state: Optional[str] = Field(None, description="State or region")
    timezone: str = Field(..., description="Timezone")
    population: Optional[int] = Field(None, description="Population")
    coordinates: Coordinates = Field(..., description="City coordinates")

class Attraction(BaseModel):
    id: str = Field(..., description="Unique attraction ID")
    name: str = Field(..., description="Attraction name")
    description: str = Field(..., description="Attraction description")
    category: AttractionCategory = Field(..., description="Attraction category")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Rating from 0 to 5")
    address: Optional[str] = Field(None, description="Address")
    coordinates: Optional[Coordinates] = Field(None, description="Coordinates")
    opening_hours: Optional[str] = Field(None, description="Opening hours")
    price_range: Optional[PriceRange] = Field(None, description="Price range")
    website: Optional[str] = Field(None, description="Website URL")
    image_url: Optional[str] = Field(None, description="Image URL")

class TransportationInfo(BaseModel):
    type: TransportationType = Field(..., description="Transportation type")
    name: str = Field(..., description="Transportation name")
    description: str = Field(..., description="Description")
    estimated_time: str = Field(..., description="Estimated travel time")
    estimated_cost: Optional[str] = Field(None, description="Estimated cost")
    route: Optional[str] = Field(None, description="Route information")

class WeatherInfo(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    description: str = Field(..., description="Weather description")
    icon: str = Field(..., description="Weather icon code")

class LocationContext(BaseModel):
    city: CityInfo = Field(..., description="City information")
    attractions: List[Attraction] = Field(default_factory=list, description="Local attractions")
    transportation: List[TransportationInfo] = Field(default_factory=list, description="Transportation options")
    weather: Optional[WeatherInfo] = Field(None, description="Current weather")
    local_time: str = Field(..., description="Local time")
    timezone: str = Field(..., description="Timezone")

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude")
    include_weather: bool = Field(True, description="Include weather information")
    include_attractions: bool = Field(True, description="Include attractions")
    include_transportation: bool = Field(True, description="Include transportation info")

class CityAttractionsRequest(BaseModel):
    city: str = Field(..., description="City name")
    country_code: Optional[str] = Field(None, description="Country code")
    limit: int = Field(10, ge=1, le=50, description="Maximum number of attractions")

class CityTransportationRequest(BaseModel):
    city: str = Field(..., description="City name")
    limit: int = Field(10, ge=1, le=50, description="Maximum number of transportation options")

class LocationResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    data: Optional[LocationContext] = Field(None, description="Location context data")
    error: Optional[str] = Field(None, description="Error message")

class AttractionsResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    data: Optional[List[Attraction]] = Field(None, description="Attractions data")
    error: Optional[str] = Field(None, description="Error message")

class TransportationResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    data: Optional[List[TransportationInfo]] = Field(None, description="Transportation data")
    error: Optional[str] = Field(None, description="Error message")
