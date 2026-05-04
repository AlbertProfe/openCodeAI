#!/usr/bin/env python3
import json
import time
import requests
from datetime import datetime

# ========================= CONFIG =========================
ENDPOINT = "https://xxxxxxxxxxxxxxxxxxxxxe6m.appsync-api.eu-central-1.amazonaws.com/graphql"
API_KEY = "xxxxxxxxxxxxxxxxxxxxxxxxr63m"
# =========================================================

def main():
    print(f"Endpoint: {ENDPOINT}")
    
    # Record start time
    start_time = datetime.now()
    start_sec = time.perf_counter()
    
    print(f"Starting at: {start_time.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
    
    # GraphQL Query
    query = {
        "query": """
            query listCourses {
                listCourses(filter: { courseId: { eq: "WEB_APP_2030" } }) {
                    items {
                        courseId
                        courseItem
                        schoolId
                        schoolItem
                        age
                        email
                        name
                        createdAt
                    }
                    nextToken
                }
            }
        """
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    # Make the request
    try:
        response = requests.post(
            ENDPOINT,
            headers=headers,
            json=query,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return
    except json.JSONDecodeError:
        print("Failed to parse JSON response")
        return
    
    # Record end time
    end_time = datetime.now()
    end_sec = time.perf_counter()
    
    duration = end_sec - start_sec
    
    # Count returned items
    try:
        items = len(data.get("data", {}).get("listCourses", {}).get("items", []))
    except (TypeError, AttributeError):
        items = 0
    
    # Output results
    print(f"Complete at: {end_time.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
    print(f"Latency for this request: {duration:.6f} seconds")
    print(f"Total objects returned: {items}")
    
    # Projection for 1000 objects
    if items > 0:
        projection = (1000 * duration) / items
        print(f"Projected latency for 1000 objects: {projection:.6f} seconds")
    else:
        print("Cannot project 1000 objects (items = 0)")

if __name__ == "__main__":
    main()
