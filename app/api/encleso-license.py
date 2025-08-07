import json
import requests
from http.server import BaseHTTPRequestHandler
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get Encleso license key from environment variable
            
            LICENSE_KEY = os.environ.get("ENCLSO_LICENSE_KEY")
            
            # Encleso API endpoint
            ENCLESO_API_URL = os.environ.get("ENCLESO_API_URL")
            
            # Prepare the request payload
            payload = {
                "licenseKey": LICENSE_KEY
            }
            
            # Set headers
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            # Make request to Encleso API
            response = requests.post(
                ENCLESO_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            # Check if request was successful
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    token = response_data.get("token")
                    
                    if token:
                        # Return success response with token
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                        self.end_headers()
                        
                        response_body = json.dumps({
                            "success": True,
                            "token": token
                        })
                        self.wfile.write(response_body.encode())
                    else:
                        # Token not found in response
                        self.send_error_response(400, "Token not found in Encleso response")
                        
                except json.JSONDecodeError:
                    # Invalid JSON response from Encleso
                    self.send_error_response(500, "Invalid response from Encleso API")
                    
            else:
                # Encleso API returned error
                self.send_error_response(
                    response.status_code, 
                    f"Encleso API error: {response.text}"
                )
                
        except requests.exceptions.Timeout:
            self.send_error_response(408, "Request to Encleso API timed out")
            
        except requests.exceptions.ConnectionError:
            self.send_error_response(503, "Unable to connect to Encleso API")
            
        except requests.exceptions.RequestException as e:
            self.send_error_response(500, f"Request error: {str(e)}")
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, status_code, message):
        """Send error response with proper headers"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        error_response = json.dumps({
            "success": False,
            "error": message
        })
        self.wfile.write(error_response.encode())




