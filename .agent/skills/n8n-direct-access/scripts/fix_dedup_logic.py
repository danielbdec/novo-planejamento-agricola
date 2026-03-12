import sys
import os

# Add the script directory to path to import n8n_client
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "BNt9cLp1IJvpBdyg"
NODE_NAME = "Filtro de Deduplicacao"

def fix_deduplication():
    print(f"Fetching workflow {TARGET_WORKFLOW_ID}...")
    wf = n8n_client.get_workflow(TARGET_WORKFLOW_ID)
    
    if not wf:
        print("Failed to fetch workflow to update.")
        return

    # Find the node
    target_node = None
    for node in wf.get('nodes', []):
        if node.get('name') == NODE_NAME:
            target_node = node
            break
    
    if not target_node:
        print(f"Node '{NODE_NAME}' not found in workflow.")
        return

    print("Found node. Updating JS Code...")
    
    # Original Code Fragment to replace:
    # const key = `${err.workflowId}:${err.nodeName}:${err.errorMessage}`;
    
    current_code = target_node['parameters']['jsCode']
    
    # The fix: Remove errorMessage from key
    new_code = current_code.replace(
        "const key = `${err.workflowId}:${err.nodeName}:${err.errorMessage}`;",
        "const key = `${err.workflowId}:${err.nodeName}`; // Fix: Key only by Node, ignoring dynamic error message"
    )
    
    if new_code == current_code:
        print("WARNING: Could not find the exact line to replace. The code might have changed or format is different.")
        print("Current code snippet around 'const key':")
        # Simple fuzzy check
        import re
        match = re.search(r"const key = .*", current_code)
        if match:
            print(match.group(0))
        
        # Hard replace if fuzzy match fails but structure is known
        # Let's try a regex replace to be safer about whitespace
        new_code = re.sub(
            r"const key = `\$\{err\.workflowId\}:\$\{err\.nodeName\}:\$\{err\.errorMessage\}`;",
            "const key = `${err.workflowId}:${err.nodeName}`; // Fix: Dedup per node only",
            current_code
        )
        
        if new_code == current_code:
            print("Regex replace also failed. Aborting to avoid corrupting code.")
            return

    target_node['parameters']['jsCode'] = new_code
    
    # Sanitize for PUT request
    # Retry with STRICT minimal payload
    # API rejects read-only fields and `active` status usually needs separate handling.
    keys_to_keep = ['name', 'nodes', 'connections', 'settings']
    payload = {k: v for k, v in wf.items() if k in keys_to_keep}

    print("Applying update...")
    print(f"Payload keys: {list(payload.keys())}")
    
    # Check time before
    print(f"Old updatedAt: {wf.get('updatedAt')}")
    
    response = n8n_client.update_workflow(TARGET_WORKFLOW_ID, payload)
    
    if response:
        print("Update API call successful.")
        
        # Immediate verification
        print("Verifying persistence...")
        check_wf = n8n_client.get_workflow(TARGET_WORKFLOW_ID)
        if check_wf:
            print(f"New updatedAt: {check_wf.get('updatedAt')}")
            
            # Extract code to see if it changed
            new_target_node = next((n for n in check_wf['nodes'] if n['name'] == NODE_NAME), None)
            if new_target_node:
                saved_code = new_target_node['parameters']['jsCode']
                if "Key only by Node" in saved_code:
                    print("\n[SUCCESS] Code change VERIFIED in returned workflow!")
                else:
                    print("\n[FAILURE] Workflow updated but code change NOT found.")
            else:
                 print("\n[FAILURE] Node not found in verification step.")
    else:
        print("Update Failed.")

if __name__ == "__main__":
    fix_deduplication()
