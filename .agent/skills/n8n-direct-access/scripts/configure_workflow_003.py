import sys
import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "SIiqar9UFcWZXaxR"

def update_workflow_nodes():
    print(f"Fetching workflow {TARGET_WORKFLOW_ID}...")
    wf = n8n_client.get_workflow(TARGET_WORKFLOW_ID)
    
    if not wf:
        print("Failed to fetch workflow.")
        return

    print("Analyzing nodes...")
    nodes_updated = 0
    
    for node in wf.get('nodes', []):
        node_name = node.get('name')
        
        # 1. Update 'Seta Campos' (Set Node)
        if node_name == "Seta Campos":
            print(f"Updating Node: {node_name}")
            assignments = node.get('parameters', {}).get('assignments', {}).get('assignments', [])
            for item in assignments:
                # Using $json.body.* as requested
                if item['name'] == 'grp':
                    item['value'] = "={{ $json.body.grp }}"
                elif item['name'] == 'filial':
                    item['value'] = "={{ $json.body.filial }}"
                elif item['name'] == 'nome':
                    item['value'] = "={{ $json.body.nome }}"
                elif item['name'] == 'cnpj':
                    item['value'] = "={{ $json.body.cnpj }}"
            nodes_updated += 1
            
        # 2. Update 'Busca SYS_COMP' (SQL Node)
        if node_name == "Busca SYS_COMP":
            print(f"Updating Node: {node_name}")
            # Current: AND M0_CODIGO ='grp' AND M0_CODFIL = 'filial'
            # Target: AND M0_CODIGO ='{{ $json.grp }}' AND M0_CODFIL = '{{ $json.filial }}'
            
            # Using simple replacement
            current_query = node.get('parameters', {}).get('query', '')
            
            new_query = current_query.replace("='grp'", "='{{ $json.grp }}'")
            new_query = new_query.replace("= 'filial'", "= '{{ $json.filial }}'")
            
            node['parameters']['query'] = new_query
            nodes_updated += 1

    if nodes_updated == 0:
        print("No nodes matched update criteria.")
        return

    print("Sanitizing payload...")
    keys_to_keep = ['name', 'nodes', 'connections', 'settings']
    payload = {k: v for k, v in wf.items() if k in keys_to_keep}
    
    if 'settings' in payload:
        settings_keep = ['executionOrder', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution']
        payload['settings'] = {k: v for k, v in payload['settings'].items() if k in settings_keep}

    if 'pinData' in payload:
        del payload['pinData']

    print("Applying update...")
    response = n8n_client.update_workflow(TARGET_WORKFLOW_ID, payload)
    
    if response:
        print("Update Successful.")
        
        # Trigger Test
        print("\n--- Triggering Test Execution ---")
        test_payload = {
            "grp": "01",
            "filial": "0401",
            "nome": "gcs"
        }
        res = n8n_client.execute_workflow(TARGET_WORKFLOW_ID, test_payload)
        
    else:
        print("Update Failed.")

if __name__ == "__main__":
    update_workflow_nodes()
