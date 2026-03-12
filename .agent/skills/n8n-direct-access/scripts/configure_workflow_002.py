import sys
import os
import json

# Add the script directory to path to import n8n_client
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import n8n_client

TARGET_WORKFLOW_ID = "X70SGZcuWsGrhx9g"

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
                if item['name'] == 'grp':
                    item['value'] = "={{ $json.body.grp }}"
                elif item['name'] == 'filial':
                    item['value'] = "={{ $json.body.filial }}"
                elif item['name'] == 'nome':
                    item['value'] = "={{ $json.body.nome }}"
            nodes_updated += 1

        # 2. Update 'Busca SED010' and 'Busca SED030' (SQL Nodes)
        if node_name in ["Busca SED010", "Busca SED030"]:
            print(f"Updating Node: {node_name}")
            # Current: ... LIKE UPPER('%nome%') ... SUBSTRING('filial',1,2)
            # Target: ... LIKE UPPER('%{{ $json.nome }}%') ... SUBSTRING('{{ $json.filial }}',1,2)
            
            # Note: In n8n expression syntax within SQL, we usually use {{ $json.var }}.
            # The user code had literal strings 'nome' inside the query.
            
            current_query = node.get('parameters', {}).get('query', '')
            
            # Replace 'nome' with {{ $json.nome }}
            # Careful with quotes. The original is UPPER('%nome%').
            # We want UPPER('%{{ $json.nome }}%').
            
            new_query = current_query.replace("'%nome%'", "'%{{ $json.nome }}%'")
            new_query = new_query.replace("'filial'", "'{{ $json.filial }}'")
            
            node['parameters']['query'] = new_query
            nodes_updated += 1
            
        # 3. Switch Node 'Grupo' usually refers to 'grp'.
        # In the JSON view: leftValue: "grp".
        # If the input comes from 'Seta Campos', "grp" as a key identifier is usually fine in v3.
        # But if we want to be explicit/dynamic:
        # The user said: "no no switch... vc tem que colocar tambem os json"
        if node_name == "Grupo":
             # Check if it's using 'grp' string logic or expression
             # In v3 Switch, 'leftValue' is often an expression.
             # If it is currently "grp", n8n interprets it as "value of field grp".
             # If we want to force expression: "={{ $json.grp }}"
             
             # Looking at input JSON: leftValue: "grp".
             # Let's update it to expression for safety/explicitness if that's what user implies.
             # But "grp" key lookup is standard.
             # However, given "nao seja preguicoso", I will check deeply.
             
             # Actually, for Switch v3, if 'leftValue' is 'grp', it looks for keys.
             # If I change it to '={{ $json.grp }}', it becomes an expression.
             # I will update it to be an expression to be 100% compliant with "use jsons".
             
             rules = node.get('parameters', {}).get('rules', {}).get('values', [])
             for rule_group in rules:
                 for condition in rule_group.get('conditions', {}).get('conditions', []):
                     if condition.get('leftValue') == 'grp':
                         condition['leftValue'] = "={{ $json.grp }}"
                         print(f"Updated Switch condition in {node_name}")
                         nodes_updated += 1


    if nodes_updated == 0:
        print("No nodes matched update criteria.")
        return

    print("Sanitizing payload...")
    # Strict payload
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
            "nome": "t.i"
        }
        res = n8n_client.execute_workflow(TARGET_WORKFLOW_ID, test_payload)
        
    else:
        print("Update Failed.")

if __name__ == "__main__":
    update_workflow_nodes()
