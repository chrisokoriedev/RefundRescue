# MCP (Model Context Protocol) Checklist

## Executive Summary
Model Context Protocol (MCP) servers allow AI assistants to interface directly with external tools, APIs, and databases securely. This checklist tracks the configuration status of MCP servers for the RevRescue repository.

> [!TIP]
> To verify active MCP tools, ask the AI agent to run `list_resources` or `call_mcp_tool` checks on the desired server names.

---

## 1. Neon Database MCP
**Purpose:** AI agent can query `recovery_logs`, verify PostgreSQL schemas, troubleshoot DB connections.

- [x] Server Installed
- [x] Environment Variables Configured (`NEON_API_KEY`, `DATABASE_URL`)
- [x] Agent Connection Verified

**Status:** ✅ **Active** — AI agent can run `run_sql` and `describe_table_schema` against Neon.

**Usage:**
```
# List tables
describe_table_schema --table recovery_logs

# Query data
run_sql --query "SELECT * FROM recovery_logs WHERE status = 'recovered' LIMIT 5"

# Check schema
run_sql --query "\d recovery_logs"
```

---

## 2. CALL-E MCP
**Purpose:** Direct voice agent management — construct prompts, trigger test calls, pull transcripts.

- [ ] Server Installed
- [ ] Environment Variables Configured
- [ ] Agent Connection Verified

**Status:** ⏳ **Pending** — Awaiting official MCP support from CALL-E.

**Current Workaround:** Use CLI integration via `services/calleService.ts` or REST client via `services/calleRestApi.ts`.

---

## 3. GitHub MCP
**Purpose:** Read/write Pull Requests, manage issues, review code diffs.

- [ ] Server Installed
- [ ] Personal Access Token (PAT) Configured
- [ ] Agent Connection Verified

**Status:** ⏳ **Planned** — Slated for implementation as team scales.

---

## 4. Stripe MCP (Future)
**Purpose:** Direct Stripe API access — manage customers, invoices, subscriptions from IDE.

- [ ] Server Installed
- [ ] Environment Variables Configured
- [ ] Agent Connection Verified

**Status:** ⏳ **Planned** — Would enable direct Stripe debugging from AI agent.

---

## 5. Sentry MCP (Future)
**Purpose:** Query error tracking data, analyze exceptions, manage alerts.

- [ ] Server Installed
- [ ] Environment Variables Configured
- [ ] Agent Connection Verified

**Status:** ⏳ **Planned** — Sentry error tracking is configured; MCP integration pending.

---

## Setup Instructions

### Neon MCP
```bash
# Install Neon MCP server
npx @neon-mcp/server

# Configure in .mcp.json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["@neon-mcp/server"],
      "env": {
        "NEON_API_KEY": "<your-api-key>",
        "DATABASE_URL": "<your-connection-string>"
      }
    }
  }
}
```

### Verify Connection
Ask the AI agent:
> "Run `describe_table_schema` on the Neon database to verify the recovery_logs table structure"
