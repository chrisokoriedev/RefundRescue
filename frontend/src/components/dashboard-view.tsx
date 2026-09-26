"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchMetrics,
  fetchLogs,
  fetchAnalytics,
  type Metrics,
  type LogRecord,
  type AnalyticsSummary,
} from "@/lib/api";
import {
  onCallStarted,
  onCallStatus,
  onCallCompleted,
  onMetricsUpdated,
  onSmsSent,
  onSocketConnect,
  onSocketError,
  getDashboardSocket,
} from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  PhoneCall,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  WifiOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface DashboardInitial {
  metrics: Metrics | null;
  logs: LogRecord[];
  analytics: AnalyticsSummary | null;
}

// ─── KPI Card ───────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  loading?: boolean;
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent bar */}
      {accent && (
        <div
          className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`}
        />
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-muted p-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tracking-tight">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    recovered: "default",
    in_progress: "secondary",
    planned: "outline",
    failed: "destructive",
  };
  return (
    <Badge variant={variants[status] || "outline"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

// ─── Dashboard View (client) ────────────────────────────────────────
export default function DashboardView({ initial }: { initial: DashboardInitial }) {
  const [metrics, setMetrics] = useState<Metrics | null>(initial.metrics);
  const [logs, setLogs] = useState<LogRecord[]>(initial.logs);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(initial.analytics);
  const [loading, setLoading] = useState(!initial.metrics);
  const [live, setLive] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [m, l, a] = await Promise.all([
        fetchMetrics(),
        fetchLogs({ limit: 5, sortBy: "timestamp", order: "desc" }),
        fetchAnalytics().catch(() => null),
      ]);
      if (!mounted.current) return;
      setMetrics(m);
      setLogs(l.data);
      setAnalytics(a);
    } catch (e) {
      console.error("Dashboard refresh failed:", e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // ── WebSocket real-time (replaces heavy polling) ──────────────────
  useEffect(() => {
    mounted.current = true;
    const socket = getDashboardSocket();

    const offs = [
      onSocketConnect(() => {
        setLive(true);
        refresh(true);
      }),
      onSocketError(() => {
        setLive(false);
      }),
      onCallStarted((e) => {
        setLive(true);
        setLastEvent(`📞 Call started: ${e.customerName}`);
        refresh(true);
      }),
      onCallStatus((e) => {
        setLastEvent(`☎️ Call status: ${e.customerName} — ${e.status}`);
      }),
      onCallCompleted((e) => {
        setLive(true);
        setLastEvent(
          e.outcome === "recovered"
            ? `✅ Recovered: ${e.customerName} ($${e.mrr})`
            : `❌ Failed: ${e.customerName}`
        );
        refresh(true);
      }),
      onSmsSent((e) => {
        setLive(true);
        setLastEvent(
          e.delivered
            ? `📱 SMS delivered: ${e.customerName || e.phone} ($${e.amount})`
            : `📱 SMS queued (dev): ${e.customerName || e.phone} ($${e.amount})`
        );
      }),
      onMetricsUpdated((m) => {
        setLive(true);
        setLastEvent(`📊 Metrics updated: $${m.recoveredMRR.toLocaleString()} recovered`);
        setMetrics((prev) =>
          prev
            ? {
                ...prev,
                totalCalls: m.totalCalls,
                successfulRecoveries: m.recovered,
                failedRecoveries: m.failed,
                recoveredRevenue: m.recoveredMRR,
                activeCalls: prev.activeCalls,
                conversionRate:
                  m.totalCalls > 0
                    ? Math.round((m.recovered / m.totalCalls) * 100)
                    : prev.conversionRate,
              }
            : prev
        );
      }),
    ];

    // Fallback polling only when socket is not connected
    const interval = setInterval(() => {
      if (!socket.connected) refresh(true);
    }, 30000);

    return () => {
      mounted.current = false;
      offs.forEach((off) => off());
      clearInterval(interval);
    };
  }, []);

  // Chart data — prefer real analytics breakdown, else last-7-day mock
  const chartData = analytics?.byScenario && Object.keys(analytics.byScenario).length
    ? Object.entries(analytics.byScenario).map(([name, value]) => ({
        name: name.replace("_", " "),
        revenue: value,
      }))
    : [
        { name: "Mon", revenue: 400 },
        { name: "Tue", revenue: 800 },
        { name: "Wed", revenue: 600 },
        { name: "Thu", revenue: 1200 },
        { name: "Fri", revenue: 900 },
        { name: "Sat", revenue: 1400 },
        { name: "Sun", revenue: 1100 },
      ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Revenue recovery overview and system health
          </p>
        </div>
        <Badge
          variant="outline"
          className={`gap-1.5 ${live ? "text-emerald-500" : "text-muted-foreground"}`}
        >
          {live ? (
            <>
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Polling
            </>
          )}
        </Badge>
      </div>

      {/* Real-time activity ticker */}
      {lastEvent && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-medium">{lastEvent}</span>
          <span className="text-xs text-muted-foreground ml-auto">live</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Recovered Revenue"
          value={`$${(metrics?.recoveredRevenue || 0).toLocaleString()}`}
          subtitle="20% performance billing"
          icon={DollarSign}
          trend="up"
          loading={loading}
          accent="from-emerald-500 to-teal-400"
        />
        <KpiCard
          title="Total Calls"
          value={String(metrics?.totalCalls || 0)}
          subtitle="Triggered via webhooks"
          icon={PhoneCall}
          loading={loading}
          accent="from-blue-500 to-indigo-400"
        />
        <KpiCard
          title="Recovery Rate"
          value={`${metrics?.conversionRate || 0}%`}
          subtitle="vs 15% email dunning"
          icon={TrendingUp}
          trend="up"
          loading={loading}
          accent="from-violet-500 to-purple-400"
        />
        <KpiCard
          title="Active Calls"
          value={String(metrics?.activeCalls || 0)}
          subtitle="In progress right now"
          icon={Activity}
          loading={loading}
          accent="from-amber-500 to-orange-400"
        />
      </div>

      {/* Chart + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Revenue Recovered
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {analytics?.byScenario
                ? "By recovery scenario (live data)"
                : "Last 7 days (sample)"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenueFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.companyName} · ${log.mrr}
                      </p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
