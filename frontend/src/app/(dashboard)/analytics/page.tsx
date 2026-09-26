"use client";

import { useState, useEffect } from "react";
import { useCachedApi } from "@/lib/useCachedApi";
import { onMetricsUpdated, onSocketConnect } from "@/lib/socket";
import {
  fetchAnalytics,
  fetchVariantStats,
  type AnalyticsSummary,
  type VariantStats,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Trophy } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function AnalyticsPage() {
  const { data: analytics, loading: loadingAnalytics, mutate: mutateAnalytics } = useCachedApi<AnalyticsSummary>("analytics_summary", fetchAnalytics);
  const { data: variantsRaw, loading: loadingVariants, mutate: mutateVariants } = useCachedApi<VariantStats[]>("analytics_variants", fetchVariantStats);

  const variants = variantsRaw || [];
  const loading = loadingAnalytics || loadingVariants;

  useEffect(() => {
    // Re-fetch everything if socket reconnects
    const offConnect = onSocketConnect(() => {
      mutateAnalytics();
      mutateVariants();
    });

    // Re-fetch when backend pushes a new metric update
    const offMetrics = onMetricsUpdated(() => {
      mutateAnalytics();
      mutateVariants();
    });

    return () => {
      offConnect();
      offMetrics();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scenarioData = analytics?.byScenario
    ? Object.entries(analytics.byScenario).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }))
    : [];

  const statusData = analytics?.byStatus
    ? Object.entries(analytics.byStatus).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          A/B test performance and recovery metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {analytics?.conversionRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Call Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {analytics?.avgCallDuration || 0}s
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={scenarioData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Variant Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : variants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No variant data yet
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v) => (
                <div
                  key={v.variantId}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{v.variantName}</span>
                      <Badge variant="outline" className="text-xs">
                        {v.scenario.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {v.totalCalls} calls · {v.recovered} recovered · {v.failed}{" "}
                      failed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{v.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
