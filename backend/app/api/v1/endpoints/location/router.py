from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from .schema import (
    LocationRequest, LocationResponse, CityAttractionsRequest, 
    CityTransportationRequest, AttractionsResponse, TransportationResponse
)
from .service import location_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/location", tags=["location"])

@router.post("/context", response_model=LocationResponse)
async def get_location_context(request: LocationRequest):
    """
    Get complete location context including city info, attractions, transportation, and weather
    """
    try:
        context = await location_service.get_location_context(
            lat=request.latitude,
            lon=request.longitude,
            include_weather=request.include_weather,
            include_attractions=request.include_attractions,
            include_transportation=request.include_transportation
        )
        
        return LocationResponse(
            success=True,
            data=context
        )
    except Exception as e:
        logger.error(f"Failed to get location context: {e}")
        return LocationResponse(
            success=False,
            error=f"Failed to get location context: {str(e)}"
        )

@router.get("/attractions", response_model=AttractionsResponse)
async def get_city_attractions(
    city: str,
    country_code: str = None,
    limit: int = 10
):
    """
    Get attractions for a specific city
    """
    try:
        attractions = await location_service.get_city_attractions(
            city_name=city,
            country_code=country_code,
            limit=limit
        )
        
        return AttractionsResponse(
            success=True,
            data=attractions
        )
    except Exception as e:
        logger.error(f"Failed to get city attractions: {e}")
        return AttractionsResponse(
            success=False,
            error=f"Failed to get city attractions: {str(e)}"
        )

@router.post("/attractions", response_model=AttractionsResponse)
async def get_city_attractions_post(request: CityAttractionsRequest):
    """
    Get attractions for a specific city (POST version)
    """
    try:
        attractions = await location_service.get_city_attractions(
            city_name=request.city,
            country_code=request.country_code,
            limit=request.limit
        )
        
        return AttractionsResponse(
            success=True,
            data=attractions
        )
    except Exception as e:
        logger.error(f"Failed to get city attractions: {e}")
        return AttractionsResponse(
            success=False,
            error=f"Failed to get city attractions: {str(e)}"
        )

@router.get("/transportation", response_model=TransportationResponse)
async def get_city_transportation(
    city: str,
    limit: int = 10
):
    """
    Get transportation options for a specific city
    """
    try:
        transportation = await location_service.get_city_transportation(
            city_name=city,
            limit=limit
        )
        
        return TransportationResponse(
            success=True,
            data=transportation
        )
    except Exception as e:
        logger.error(f"Failed to get city transportation: {e}")
        return TransportationResponse(
            success=False,
            error=f"Failed to get city transportation: {str(e)}"
        )

@router.post("/transportation", response_model=TransportationResponse)
async def get_city_transportation_post(request: CityTransportationRequest):
    """
    Get transportation options for a specific city (POST version)
    """
    try:
        transportation = await location_service.get_city_transportation(
            city_name=request.city,
            limit=request.limit
        )
        
        return TransportationResponse(
            success=True,
            data=transportation
        )
    except Exception as e:
        logger.error(f"Failed to get city transportation: {e}")
        return TransportationResponse(
            success=False,
            error=f"Failed to get city transportation: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for location service
    """
    return {"status": "healthy", "service": "location"}
