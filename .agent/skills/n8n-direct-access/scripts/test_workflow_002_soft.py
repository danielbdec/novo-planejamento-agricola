import sys
import os
import json

# Add the script directory to path to import n8n_client
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "X70SGZcuWsGrhx9g"

def run_specific_test():
    print(f"Testing workflow {TARGET_WORKFLOW_ID} with nome='soft'...")
    
    test_payload = {
        "grp": "01",
        "filial": "0401",
        "nome": "soft"
    }
    
    # We use our previously implemented execute_workflow which hits the webhook
    n8n_client.execute_workflow(TARGET_WORKFLOW_ID, test_payload)

if __name__ == "__main__":
    run_specific_test()
