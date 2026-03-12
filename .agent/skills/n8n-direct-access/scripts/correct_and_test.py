import sys
import os
import json

# Add the script directory to path to import n8n_client
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "ByvCNn402KxabXwM"
NODE_NAME = "Seta Campos"

def correct_and_test():
    print(f"Fetching workflow {TARGET_WORKFLOW_ID}...")
    wf = n8n_client.get_workflow(TARGET_WORKFLOW_ID)
    
    if not wf:
        print("Failed to fetch workflow.")
        return

    # Find the node
    target_node = None
    for node in wf.get('nodes', []):
        if node.get('name') == NODE_NAME:
            target_node = node
            break
    
    if not target_node:
        print(f"Node '{NODE_NAME}' not found.")
        return

    print("Found node. Reverting to Dynamic Expressions...")
    
    # Correcting assignments to read from $json
    assignments = target_node.get('parameters', {}).get('assignments', {}).get('assignments', [])
    
    for item in assignments:
        if item['name'] == 'grp':
            item['value'] = "={{ $json.body.grp }}"
        elif item['name'] == 'filial':
            item['value'] = "={{ $json.body.filial }}"
        elif item['name'] == 'nome':
            item['value'] = "={{ $json.body.nome }}"
            
    print("Updated assignments to dynamic expressions.")

    # Sanitize for PUT request (STRICT minimal settings)
    keys_to_keep = ['name', 'nodes', 'connections', 'settings']
    payload = {k: v for k, v in wf.items() if k in keys_to_keep}
    
    # Filter settings keys
    if 'settings' in payload:
        settings_keep = ['executionOrder', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution']
        payload['settings'] = {k: v for k, v in payload['settings'].items() if k in settings_keep}

    if 'pinData' in payload:
        del payload['pinData']

    print("Applying update...")
    response = n8n_client.update_workflow(TARGET_WORKFLOW_ID, payload)
    
    if response:
        print("Update Successful. Variables are now dynamic.")
        
        # NOW TRIGGER THE TEST
        print("\n--- Triggering Test Execution ---")
        test_payload = {
            "grp": "01",
            "filial": "0401",
            "nome": "t.i"
        }
        res = n8n_client.execute_workflow(TARGET_WORKFLOW_ID, test_payload)
        
    else:
        print("Update Failed.")

if __name__ == "__main__":
    correct_and_test()
