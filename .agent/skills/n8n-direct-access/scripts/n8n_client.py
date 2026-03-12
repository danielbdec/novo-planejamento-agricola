import requests
import json
import sys
import os

# Path to Claude config - hardcoded for this user environment as per requirements
CONFIG_PATH = r"C:\Users\Daniel\AppData\Roaming\Claude\claude_desktop_config.json"

def load_config():
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return None

def get_api_details(server_name="n8n-gcs"):
    config = load_config()
    if not config:
        return None, None
    
    server_config = config.get("mcpServers", {}).get(server_name, {})
    env = server_config.get("env", {})
    
    return env.get("N8N_API_URL"), env.get("N8N_API_KEY")

def get_headers(api_key):
    return {
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

def get_workflow(workflow_id, server_name="n8n-gcs"):
    base_url, api_key = get_api_details(server_name)
    if not base_url or not api_key:
        print(f"Could not find credentials for {server_name}")
        return

    url = f"{base_url}/api/v1/workflows/{workflow_id}"
    print(f"Fetching: {url}")
    
    try:
        response = requests.get(url, headers=get_headers(api_key))
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def execute_workflow(workflow_id, payload, server_name="n8n-gcs"):
    # This uses the manual execution endpoint usually, or webhook if available.
    # For n8n API, there isn't a direct "execute with JSON" for arbitrary workflows unless they have a webhook.
    # However, we can use the /manual-executions endpoint if we want to simulate the editor run, OR
    # just find the webhook URL if it's a webhook workflow.
    
    # Strategy: Check if it has a Webhook node. If so, call it.
    # If not, we might be limited. But let's assume webhook for this case (it is a search workflow).
    
    base_url, api_key = get_api_details(server_name)
    
    if not base_url:
        return False

    # First fetch workflow to find Webhook URL path
    # But since we are "Ti GCS", we likely know it or can deduce.
    # Actually, simpler: Use the /webhook-test/ endpoint for testing or production webhook.
    
    # Wait, the user asked to "pass a payload". 
    # Let's try to update the 'Start' or 'Manual Trigger' node? No.
    # Let's try finding the production webhook path from the workflow JSON we just fetched.
    
    wf = get_workflow(workflow_id, server_name)
    if not wf:
        return False
        
    nodes = wf.get('nodes', [])
    webhook_node = next((n for n in nodes if n['type'] == 'n8n-nodes-base.webhook'), None)
    
    if webhook_node:
        path = webhook_node['parameters'].get('path')
        method = webhook_node['parameters'].get('httpMethod', 'GET')
        
        if path:
            # Construct URL. Assuming standard n8n webhook structure
            # n8n.gcsagro.com.br/webhook/orcamento-busca-ccusto
            
            clean_base = base_url.rstrip('/')
            webhook_url = f"{clean_base}/webhook/{path}"
            
            print(f"Clicking Webhook: {webhook_url} ({method})")
            
            try:
                if method == 'GET':
                    resp = requests.get(webhook_url, params=payload)
                else:
                    resp = requests.post(webhook_url, json=payload)
                
                print(f"Execution Status: {resp.status_code}")
                print(f"Result: {resp.text}")
                return True
            except Exception as e:
                print(f"Execution Failed: {e}")
                return False
    
    print("No Webhook node found to trigger.")
    return False

def create_workflow(workflow_data, server_name="n8n-gcs"):
    base_url, api_key = get_api_details(server_name)
    if not base_url or not api_key:
        print(f"Could not find credentials for {server_name}")
        return False

    url = f"{base_url}/api/v1/workflows"
    print(f"Creating workflow at: {url}")

    # SYSTEMATICALLY STRIP READ-ONLY FIELDS that might be present if workflow_data came from a 'get'
    read_only_keys = [
        'id', 'active', 'createdAt', 'updatedAt', 'versionId', 
        'triggerCount', 'activeVersionId', 'tags'
    ]
    safe_data = {k: v for k, v in workflow_data.items() if k not in read_only_keys}
    
    try:
        response = requests.post(url, headers=get_headers(api_key), json=safe_data)
        
        if response.status_code == 201: # 201 Created for successful POST
            print("SUCCESS: Workflow created.")
            return response.json()
        else:
            print(f"Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception during creation: {e}")
        return False

def update_workflow(workflow_id, workflow_data, server_name="n8n-gcs"):
    base_url, api_key = get_api_details(server_name)
    if not base_url or not api_key:
        print(f"Could not find credentials for {server_name}")
        return False

    # Fetch current workflow to check status
    current_wf = get_workflow(workflow_id, server_name) # Removed extract_id=False as it's not a parameter in the current get_workflow
    was_active = False
    if current_wf and current_wf.get('active'):
        print(f"Workflow {workflow_id} is ACTIVE. Deactivating for update...")
        was_active = True
        activate_workflow(workflow_id, False, server_name) # Pass server_name

    url = f"{base_url}/api/v1/workflows/{workflow_id}"
    print(f"Updating: {url}")
    
    # SYSTEMATICALLY STRIP READ-ONLY FIELDS
    # These fields cause 400 Bad Request if present in a PUT request
    read_only_keys = [
        'id', 'active', 'createdAt', 'updatedAt', 'versionId', 
        'triggerCount', 'activeVersionId', 'tags' # Tags can be tricky, safest to verify format or omit if not changing
    ]
    safe_data = {k: v for k, v in workflow_data.items() if k not in read_only_keys}
    
    try:
        response = requests.put(url, headers=get_headers(api_key), json=safe_data)
        
        if response.status_code == 200:
            print("SUCCESS: Workflow updated.")
            
            # Reactivate if it was active
            if was_active:
                print("Re-activating workflow...")
                activate_workflow(workflow_id, True, server_name) # Pass server_name
                
            return response.json()
        else:
            print(f"Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception during update: {e}")
        return False

def activate_workflow(workflow_id, active=True, server_name="n8n-gcs"): # Added server_name parameter
    base_url, api_key = get_api_details(server_name) # Pass server_name
    if not base_url or not api_key: # Added check for credentials
        print(f"Could not find credentials for {server_name} to activate workflow.")
        return False
    url = f"{base_url}/api/v1/workflows/{workflow_id}/activate"
    try:
        response = requests.post(url, headers=get_headers(api_key), json={"active": active})
        if response.status_code == 200:
            print(f"Workflow {workflow_id} activation set to {active} successfully.")
            return True
        else:
            print(f"Error {response.status_code} activating workflow: {response.text}")
            return False
    except Exception as e:
        print(f"Exception during workflow activation: {e}")
        return False

def list_workflows(server_name="n8n-gcs"):
    base_url, api_key = get_api_details(server_name)
    if not base_url or not api_key:
        print(f"Could not find credentials for {server_name}")
        return

    url = f"{base_url}/api/v1/workflows"
    print(f"Listing: {url}")
    
    try:
        response = requests.get(url, headers=get_headers(api_key))
        if response.status_code == 200:
            data = response.json()
            return data.get('data', [])
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python n8n_client.py <command> <arg> [server_name]")
        print("Commands: list, get <workflow_id>, update <workflow_id> <json_file>")
        sys.exit(1)

    command = sys.argv[1]
    
    if command == "list":
        server = sys.argv[2] if len(sys.argv) > 2 else "n8n-gcs"
        workflows = list_workflows(server)
        if workflows:
            print(f"Found {len(workflows)} workflows:")
            for wf in workflows:
                print(f"ID: {wf['id']} | Name: {wf['name']} | Active: {wf['active']}")
        return

    if len(sys.argv) < 3:
        print("Usage: python n8n_client.py <command> <arg> [server_name]")
        sys.exit(1)

    arg = sys.argv[2]
    server = sys.argv[3] if len(sys.argv) > 3 else "n8n-gcs"

    if command == "get":
        wf = get_workflow(arg, server)
        if wf:
            print("SUCCESS: Workflow retrieved.")
            # Print minimal info to stdout, save full to file
            print(f"Name: {wf.get('name')}")
            
            # Save to current directory or a temp location
            filename = f"workflow_{arg}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(wf, f, indent=2)
            print(f"Workflow saved to {os.path.abspath(filename)}")
        else:
            print("Failed to retrieve workflow.")

    elif command == "update":
        # Usage: python n8n_client.py update <workflow_id> <json_file_path> [server]
        if len(sys.argv) < 4:
            print("Usage for update: python n8n_client.py update <workflow_id> <json_file_path> [server]")
            sys.exit(1)
        
        json_file = sys.argv[3]
        server = sys.argv[4] if len(sys.argv) > 4 else "n8n-gcs"
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                workflow_data = json.load(f)
            
            result = update_workflow(arg, workflow_data, server)
            if result:
                print(f"SUCCESS: Workflow {arg} updated from {json_file}")
            else:
                print(f"Failed to update workflow {arg}")
        except Exception as e:
            print(f"Error reading JSON file or updating: {e}")

if __name__ == "__main__":
    main()
