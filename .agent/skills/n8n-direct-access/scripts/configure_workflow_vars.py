import sys
import os
import json

# Add the script directory to path to import n8n_client
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "ByvCNn402KxabXwM"
NODE_NAME = "Seta Campos"

def configure_workflow():
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

    print("Found node. Configuring values...")
    
    # Target structure: Use assignments
    # We need to set 'value' for each variable
    assignments = target_node.get('parameters', {}).get('assignments', {}).get('assignments', [])
    
    for item in assignments:
        if item['name'] == 'grp':
            item['value'] = "01"
        elif item['name'] == 'filial':
            item['value'] = "0401"
        elif item['name'] == 'nome':
            item['value'] = "t.i"
            
    print("Updated assignments locally.")

    # Sanitize for PUT request (STRICT minimal payload)
    # 'settings' is required. 'tags' is READ-ONLY.
    keys_to_keep = ['name', 'nodes', 'connections', 'settings']
    payload = {k: v for k, v in wf.items() if k in keys_to_keep}
    
    # Filter settings keys
    if 'settings' in payload:
        # Keep only standard keys that are usually safe
        settings_keep = ['executionOrder', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution']
        # If original has it, keep it if it's in our safe list
        payload['settings'] = {k: v for k, v in payload['settings'].items() if k in settings_keep}

    # Just to be 100% sure, remove pinData if it snuck in via some other way (it shouldn't with correct filtering)
    if 'pinData' in payload:
        del payload['pinData']
    
    print("Applying update...")
    print(f"Payload keys: {list(payload.keys())}")
    
    # Check time before
    print(f"Old updatedAt: {wf.get('updatedAt')}")
    
    response = n8n_client.update_workflow(TARGET_WORKFLOW_ID, payload)
    
    if response:
        print("Update API call successful.")
        
        # Verify persistence
        print("Verifying persistence...")
        check_wf = n8n_client.get_workflow(TARGET_WORKFLOW_ID)
        if check_wf:
            print(f"New updatedAt: {check_wf.get('updatedAt')}")
            
            # Check values
            new_node = next((n for n in check_wf['nodes'] if n['name'] == NODE_NAME), None)
            new_assigns = new_node.get('parameters', {}).get('assignments', {}).get('assignments', [])
            
            grp = next((x['value'] for x in new_assigns if x['name'] == 'grp'), None)
            filial = next((x['value'] for x in new_assigns if x['name'] == 'filial'), None)
            nome = next((x['value'] for x in new_assigns if x['name'] == 'nome'), None)
            
            print(f"Verified Values -> grp: {grp}, filial: {filial}, nome: {nome}")
            
            if grp == "01" and filial == "0401" and nome == "t.i":
                print("[SUCCESS] Values configured correctly.")
            else:
                print("[FAILURE] Values do not match expected configuration.")
    else:
        print("Update Failed.")

if __name__ == "__main__":
    configure_workflow()
