import requests
import time

def get_location_from_coordinates(lat, lng):
    """
    Get state and district information from coordinates using Nominatim API
    """
    try:
        # Use Nominatim API to get location information
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
        
        headers = {
            'User-Agent': 'CropRecommendationSystem/1.0 (your_email@example.com)'
        }
        
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if 'error' in data:
            return {"error": "Could not retrieve location information"}
        
        address = data.get('address', {})
        
        # Extract state and district information
        location_info = {}
        
        if 'state' in address:
            location_info['state'] = address['state']
        
        if 'county' in address:
            location_info['district'] = address['county']
        elif 'district' in address:
            location_info['district'] = address['district']
        elif 'city' in address:
            location_info['district'] = address['city']
        
        return location_info
        
    except Exception as e:
        return {"error": f"Error retrieving location: {str(e)}"}