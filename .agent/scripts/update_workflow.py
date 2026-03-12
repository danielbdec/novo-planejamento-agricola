
import requests
import json
import os
import sys

# Default Configuration (Fallback)
DEFAULT_API_URL_BASE = "https://n8n.gcsagro.com.br/api/v1/workflows"
DEFAULT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZTQ2NWNkNS1kNjVlLTRjMjItYmNhMC02NDdhM2Q1M2U1YTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwMzc2MTQ5fQ.DQTG5LZ867TKAWrQh9M2UUSASOgj8-IKUm2CoMwVvY4"

def update_workflow(workflow_id, file_path, api_key=None, base_url=None):
    base_url = base_url or os.environ.get("N8N_API_URL_GCS") or DEFAULT_API_URL_BASE
    api_key = api_key or os.environ.get("N8N_API_KEY_GCS") or DEFAULT_API_KEY
    
    if base_url.endswith("/"):
        base_url = base_url[:-1]
        
    url = f"{base_url}/{workflow_id}"

    headers = {
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    print(f"Updating workflow ID: {workflow_id}")
    print(f"URL: {url}")
    print(f"Source file: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            workflow_data = json.load(f)

        # CLEANUP: Remove read-only or invalid properties for PUT requests
        # The API often rejects 'id', 'createdAt', 'updatedAt', etc. if sent in the body implies a change or validation strictness
        
        # Keep only essential fields for update
        payload = {
            "name": workflow_data.get("name"),
            "nodes": workflow_data.get("nodes"),
            "connections": workflow_data.get("connections"),
            "settings": workflow_data.get("settings", {}),
            "staticData": workflow_data.get("staticData")
        }
        
        # Remove None values to avoid sending nulls where not expected
        payload = {k: v for k, v in payload.items() if v is not None}

        response = requests.put(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            print("Success! Workflow updated.")
            result = response.json()
            print(f"Name: {result.get('name')}")
            print(f"Active: {result.get('active')}")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Default behavior
        default_id = "BNt9cLp1IJvpBdyg"
        default_file = "workflow_BNt9cLp1IJvpBdyg.json"
        
        if os.path.exists(default_file):
            print(f"No args provided. Retry default update for {default_id}...")
            update_workflow(default_id, default_file)
        else:
            print("Usage: python update_workflow.py <WORKFLOW_ID> <JSON_FILE_PATH>")
    else:
        update_workflow(sys.argv[1], sys.argv[2])
