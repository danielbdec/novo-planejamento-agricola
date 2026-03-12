---
name: n8n-direct-access
description: Bypasses standard MCP tools to access n8n GCS/Uninova directly via Python API. Use this when MCP tools fail to list workflows or when standard tools report "Workflow not found".
---

# n8n Direct Access Skill

> **Trigger:** When standard n8n MCP tools fail, return incomplete lists, or when the user mentions "Use Python direct access" for n8n.

This skill provides a direct Python-based method to interact with the n8n API, bypassing the MCP layer which has known visibility issues with certain workflows on GCS/Uninova instances.

## 1. Capabilities

- **Fetch Workflow JSON**: Retrieve the full JSON definition of a workflow by ID.
- **List Workflows**: List all active workflows directly from the API.
- **Update Workflow**: (To be implemented) Push changes back to the API.

## 2. Usage Strategy

Instead of:
`mcp_n8n-GCS_get_workflow_details(id)`

Use:
Run `python .agent/skills/n8n-direct-access/scripts/n8n_client.py get <WORKFLOW_ID>`

## 3. Configuration

The script automatically reads credentials from `C:\Users\Daniel\AppData\Roaming\Claude\claude_desktop_config.json`.
No manual credential setup is required if the Claude config is present.

## 4. Script Location

Script is located at: `.agent/skills/n8n-direct-access/scripts/n8n_client.py`
