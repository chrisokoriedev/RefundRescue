import DashboardView, { type DashboardInitial } from "@/components/dashboard-view";

// Server Component — fetches initial data at request time, then the
// client view takes over with WebSocket real-time updates (doc §3.2 RSC).
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const [metrics, logs, analytics] = await Promise.all([
    fetchJson<DashboardInitial["metrics"]>("/api/v1/metrics"),
    fetchJson<DashboardInitial["logs"]>(
      "/api/v1/logs?limit=5&sortBy=timestamp&order=desc"
    ).then((r) => r ?? []),
    fetchJson<DashboardInitial["analytics"]>("/api/v1/analytics"),
  ]);

  const initial: DashboardInitial = { metrics, logs, analytics };

  return <DashboardView initial={initial} />;
}
