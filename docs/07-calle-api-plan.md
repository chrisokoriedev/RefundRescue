# CALL-E API Integration Plan

## Executive Summary
RevRescue integrates with CALL-E for voice AI capabilities. The integration is currently CLI-based via `@call-e/cli`, with a REST API client ready for Phase 1 migration.

> [!TIP]
> The REST API client (`services/calleRestApi.ts`) is implemented and ready for use. The CLI integration (`services/calleService.ts`) is the current production path.

---

## 1. Current Architecture (CLI-based)

```typescript
// services/calleService.ts
import { execSync } from 'child_process';

// Generate context
const planId = execSync(`calle plan_call "You are calling ${name}..."`).toString().trim();
// Execute call
execSync(`calle run_call ${planId} ${phone}`);
```

**Status:** ✅ Working in production
**Drawbacks:** Synchronous, blocks event loop, command injection risk, limited error handling

---

## 2. REST API Client (Implemented, Not Active)

```typescript
// services/calleRestApi.ts
export class CalleRestClient {
  async planCall(prompt: string): Promise<string> { ... }
  async runCall(planId: string, phone: string): Promise<string> { ... }
  async getCallStatus(runId: string): Promise<CalleStatusResult> { ... }
  async getCallTranscript(runId: string): Promise<string> { ... }
  async getAuthStatus(): Promise<boolean> { ... }
}
```

**Status:** ✅ Implemented, ready for Phase 1 migration
**Advantages:** Async, proper error handling, no shell injection, granular HTTP errors

---

## 3. Migration Phases

### Phase 1: REST API (Ready)
- Replace `execSync` calls with `CalleRestClient` methods
- Update `calleService.ts` to use REST client as primary, CLI as fallback
- **Status:** Code written, needs activation

### Phase 2: Webhook Callbacks
- Expose `/api/webhooks/calle` for real-time call results
- **Status:** ✅ Endpoint implemented
- CALL-E POSTs transcript and status when call terminates

### Phase 3: Advanced Features
- Batch calling (multiple customers)
- Call scheduling (future time)
- Real-time call monitoring via WebSocket
- **Status:** ⏳ Planned

---

## 4. CALL-E Webhook Callback

### `POST /api/webhooks/calle`

CALL-E sends results back when calls complete:

```json
{
  "call_id": "run_abc123",
  "status": "COMPLETED",
  "message": "Call completed successfully",
  "summary": "Customer agreed to update payment method",
  "transcript": "Agent: Hello... Customer: Yes, please send the link...",
  "outcome": null,
  "activity": []
}
```

**Processing chain:**
1. Update `recovery_logs` with transcript and outcome
2. Update metrics in database
3. Send Slack notification
4. Push metrics to Stripe metadata
5. Broadcast via WebSocket to connected dashboards

---

## 5. Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `CALLE_CLI_PATH` | `calle` | Path to CALL-E CLI binary |
| `CALLE_SOURCE` | `skills_sh` | CALL-E source identifier |
| `CALLE_INTEGRATION` | `skills_sh_skill` | Integration name |
| `CALLE_INTEGRATION_VERSION` | `0.1.0` | Integration version |

---

## 6. Retry Behavior

When a CALL-E call fails, the retry queue attempts recovery:

| Attempt | Delay |
|---------|-------|
| 1st retry | 30 seconds |
| 2nd retry | 2 minutes |
| 3rd retry | 5 minutes |

After 3 failed attempts, the call is marked as `failed` and a Slack alert is sent.
