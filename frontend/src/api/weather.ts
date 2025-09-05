import weatherApi from "./client";

export interface WeatherRequest {
    city: string; 
    weather_type: "sunny" | "cloudy";
}

export const weather = async (city: string = "Astana") => {
    try {
        const response = await weatherApi.get(`/weather/${city}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};