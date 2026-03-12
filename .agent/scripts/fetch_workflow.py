
import requests
import json
import os
import sys

# Default Configuration (Fallback)
# In a perfect world, these should come from os.environ or a config file.
# For this workspace, we default to the known working credentials if not provided.

DEFAULT_API_URL_BASE = "https://n8n.gcsagro.com.br/api/v1/workflows"
DEFAULT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZTQ2NWNkNS1kNjVlLTRjMjItYmNhMC02NDdhM2Q1M2U1YTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwMzc2MTQ5fQ.DQTG5LZ867TKAWrQh9M2UUSASOgj8-IKUm2CoMwVvY4"

def fetch_workflow(workflow_id, api_key=None, base_url=None):
    base_url = base_url or os.environ.get("N8N_API_URL_GCS") or DEFAULT_API_URL_BASE
    api_key = api_key or os.environ.get("N8N_API_KEY_GCS") or DEFAULT_API_KEY
    
    # Ensure URL doesn't end with slash if we append path
    if base_url.endswith("/"):
        base_url = base_url[:-1]
        
    # If the base URL doesn't contain /workflows, assume it's the root API URL
    if "/workflows" not in base_url and not workflow_id.startswith("http"):
        url = f"{base_url}/workflows/{workflow_id}"
    elif workflow_id.startswith("http"):
        url = workflow_id
    else:
        url = f"{base_url}/{workflow_id}"

    headers = {
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    print(f"Fetching workflow ID: {workflow_id}")
    print(f"URL: {url}")

    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            print("Success! Workflow found.")
            workflow_data = response.json()
            
            # Save to file in current directory
            output_file = f"workflow_{workflow_id}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(workflow_data, f, indent=2, ensure_ascii=False)
                
            print(f"Workflow saved to: {os.path.abspath(output_file)}")
            print(f"Name: {workflow_data.get('name', 'Unknown')}")
            print(f"Node count: {len(workflow_data.get('nodes', []))}")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_workflow.py <WORKFLOW_ID>")
        # Default for testing/this specific task if run without args
        print("No ID provided. Running fallback test for known ID...")
        fetch_workflow("BNt9cLp1IJvpBdyg")
    else:
        fetch_workflow(sys.argv[1])
