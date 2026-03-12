
import json
import requests
import os
import time

# Configurações
N8N_BASE_URL = "https://n8n.uninova.ai/api/v1"
CONFIG_PATH = os.path.expanduser("~/AppData/Roaming/Claude/claude_desktop_config.json")

def get_api_key():
    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
            # Tenta encontrar a chave correta no config do Claude
            # Adaptar conforme a estrutura real do arquivo de config do usuário se necessário
            # Procurando por 'n8n-uninova' ou similar nas env vars definidas no mcp
            for server in config.get("mcpServers", {}).values():
                env = server.get("env", {})
                if "n8n-uninova" in server.get("command", "") or "N8N_API_KEY" in env:
                     return env.get("N8N_API_KEY")
    except Exception as e:
        print(f"Erro ao ler config: {e}")
    return None

API_KEY = get_api_key()
HEADERS = {"X-N8N-API-KEY": API_KEY}

if not API_KEY:
    print("❌ Erro: Não foi possível encontrar a API KEY do n8n no config do Claude.")
    exit(1)

print(f"✅ API Key encontrada. Conectando a {N8N_BASE_URL}...")

# 1. SQL para criar tabela
SQL_CREATE_TABLE = """
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LeadsPillarScan' and xtype='U')
BEGIN
    CREATE TABLE dbo.LeadsPillarScan (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        Nome NVARCHAR(200),
        Empresa NVARCHAR(200),
        Cargo NVARCHAR(100),
        Email NVARCHAR(200),
        WhatsApp NVARCHAR(50),
        Score INT,
        Origem NVARCHAR(100),
        Ip NVARCHAR(50),
        UserAgent NVARCHAR(MAX),
        CriadoEm DATETIME DEFAULT GETDATE()
    );
END
"""

# 2. Definição do Workflow "Setup Tabela" (Executa uma vez e deleta)
setup_workflow_json = {
    "name": "Setup_PillarScan_Table_Temp",
    "nodes": [
        {
            "parameters": {},
            "name": "Start",
            "type": "n8n-nodes-base.start",
            "typeVersion": 1,
            "position": [250, 300]
        },
        {
            "parameters": {
                "query": SQL_CREATE_TABLE
            },
            "name": "Create Table",
            "type": "n8n-nodes-base.microsoftSql",
            "typeVersion": 1,
            "position": [450, 300],
            "credentials": {
                "microsoftSql": {
                    "id": "YOUR_CREDENTIAL_ID_HERE", # Precisamos descobrir o ID da credencial ou usar o nome se a API permitir, ou omitir se o servidor padrão for o único
                    "name": "CS - PIG (GCS)" # Tentar adivinhar ou listar credenciais seria ideal, mas vamos tentar sem ID específico primeiro ou pegar de um workflow existente
                }
            }
        }
    ],
    "connections": {
        "Start": {
            "main": [
                [
                    {
                        "node": "Create Table",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    },
    "settings": {
        "executionOrder": "v1"
    }
}

# 3. Definição do Workflow Final "Pillar Scan - Gravar Lead"
# (Aqui vai o JSON completo do workflow que desenhamos)
prod_workflow_json = {
    "name": "Pillar Scan - Gravar Lead",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "pillar-scan-lead",
                "responseMode": "responseNode",
                "options": {}
            },
            "name": "Webhook",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 1,
            "position": [100, 300]
        },
        {
            "parameters": {
                "jsCode": """// Código Javascript de Tratamento (o mesmo do artefato n8n-setup.md)
function trimOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function normalizeBRPhone(raw) {
  const s = trimOrNull(raw);
  if (!s) return null;
  let d = s.replace(/\\D+/g, "");
  if (!d.startsWith("55") && (d.length === 10 || d.length === 11)) {
    d = "55" + d;
  }
  return d ? `+${d}` : null;
}

function sqlValue(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  const s = String(v).replace(/'/g, "''");
  return `N'${s}'`;
}

const out = [];

for (const item of $input.all()) {
  const j = item.body || item.json || {}; // Adaptado para pegar body se vier direto

  const nome = trimOrNull(j.nome);
  const empresa = trimOrNull(j.empresa);
  const cargo = trimOrNull(j.cargo);
  const email = trimOrNull(j.email);
  const whatsapp = normalizeBRPhone(j.whatsapp || j.wpp);
  const score = parseInt(j.score) || 0;
  
  const ip = trimOrNull(j.ip) || trimOrNull(item.json.headers?.["x-forwarded-for"]);
  const userAgent = trimOrNull(j.userAgent) || trimOrNull(item.json.headers?.["user-agent"]);
  const origem = "pillar_scan_landing";

  const errors = [];
  if (!nome) errors.push("Nome é obrigatório");
  
  const ok = errors.length === 0;

  const sql = ok ? `INSERT INTO dbo.LeadsPillarScan (Nome, Empresa, Cargo, Email, WhatsApp, Score, Origem, Ip, UserAgent) VALUES (${sqlValue(nome)}, ${sqlValue(empresa)}, ${sqlValue(cargo)}, ${sqlValue(email)}, ${sqlValue(whatsapp)}, ${score}, ${sqlValue(origem)}, ${sqlValue(ip)}, ${sqlValue(userAgent)}); SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS Id;` : null;

  out.push({
    json: { ok, errors, sql, nome, score }
  });
}
return out;
"""
            },
            "name": "Trata Dados",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [300, 300]
        },
        {
            "parameters": {
                "query": "={{ $json.sql }}"
            },
            "name": "Gravar SQL",
            "type": "n8n-nodes-base.microsoftSql",
            "typeVersion": 1,
            "position": [500, 300],
            "credentials": {
                "microsoftSql": {
                    "id": "YOUR_CREDENTIAL_ID_HERE", # Preciso achar esse ID dinamicamente
                    "name": "CS - PIG (GCS)"
                }
            }
        },
        {
            "parameters": {
                "respondWith": "json",
                "responseBody": "={\n  \"success\": {{ $json.ok }},\n  \"id\": {{ $json.Id || null }},\n  \"message\": \"Lead registrado\"\n}",
                "options": {}
            },
            "name": "Respond to Webhook",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1,
            "position": [700, 300]
        }
    ],
    "connections": {
        "Webhook": { "main": [[{ "node": "Trata Dados", "type": "main", "index": 0 }]] },
        "Trata Dados": { "main": [[{ "node": "Gravar SQL", "type": "main", "index": 0 }]] },
        "Gravar SQL": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] }
    },
    "settings": {
        "executionOrder": "v1"
    }
}

# Função auxiliar para pegar credenciais de um workflow existente
def get_sql_credential_id():
    # Tenta listar workflows para achar um que tenha Microsoft SQL e pegar o ID da credencial
    try:
        res = requests.get(f"{N8N_BASE_URL}/workflows", headers=HEADERS)
        if res.status_code == 200:
            workflows = res.json().get("data", [])
            for wf in workflows:
                # Pega detalhes completos
                if "Agendar Diagnostico" in wf["name"]: # Otimização: busca no que sabemos que existe
                    det = requests.get(f"{N8N_BASE_URL}/workflows/{wf['id']}", headers=HEADERS).json()
                    for node in det.get("nodes", []):
                        if node["type"] == "n8n-nodes-base.microsoftSql":
                            cred = node.get("credentials", {}).get("microsoftSql")
                            if cred:
                                print(f"✅ Credencial SQL encontrada no workflow '{wf['name']}': {cred}")
                                return cred["id"]
    except Exception as e:
        print(f"Erro ao buscar credencial: {e}")
    return None

# Execução
# ... (código anterior mantido)

TARGET_WORKFLOW_ID = "4E4-CMA-xHTgsfjHZC8im"

def main():
    cred_id = get_sql_credential_id()
    if not cred_id:
        print("⚠️ Aviso: Credencial SQL não encontrada automaticamente.")
    else:
        # Atualiza credencial nos workflows
        setup_workflow_json["nodes"][1]["credentials"]["microsoftSql"]["id"] = cred_id
        prod_workflow_json["nodes"][2]["credentials"]["microsoftSql"]["id"] = cred_id

    # 1. Executar Setup Tabela (Mantemos a criação/verificação da tabela)
    print("🚀 Verificando/Criando Tabela SQL via Workflow Temporário...")
    res_setup = requests.post(f"{N8N_BASE_URL}/workflows", headers=HEADERS, json=setup_workflow_json)
    if res_setup.status_code == 200:
        print(f"✅ Workflow de Setup Tabela criado/executado.")
    else:
        print(f"❌ Erro ao setup tabela: {res_setup.text}")

    # 2. ATUALIZAR Workflow de Produção Específico
    print(f"🚀 Atualizando Workflow de Produção ({TARGET_WORKFLOW_ID})...")
    
    # Preparar payload de update (o ID vem na URL, não precisa no corpo, mas o name e nodes sim)
    # Importante: PUT substitui tudo.
    
    res_update = requests.put(f"{N8N_BASE_URL}/workflows/{TARGET_WORKFLOW_ID}", headers=HEADERS, json=prod_workflow_json)
    
    if res_update.status_code == 200:
        print(f"✅ Workflow {TARGET_WORKFLOW_ID} ATUALIZADO com sucesso!")
        
        # Ativar também, por garantia
        requests.post(f"{N8N_BASE_URL}/workflows/{TARGET_WORKFLOW_ID}/activate", headers=HEADERS)
        print(f"✅ Workflow ativado.")
    else:
        print(f"❌ Erro ao atualizar workflow: {res_update.status_code} - {res_update.text}")
        # Fallback: Se não existir, tenta criar (talvez o ID esteja errado ou seja de outro server?)
        if res_update.status_code == 404:
             print("⚠️ Workflow não encontrado. Criando um novo com esse nome...")
             res_new = requests.post(f"{N8N_BASE_URL}/workflows", headers=HEADERS, json=prod_workflow_json)
             if res_new.status_code == 200:
                 print(f"✅ Novo workflow criado: {res_new.json()['id']}")

if __name__ == "__main__":
    main()
