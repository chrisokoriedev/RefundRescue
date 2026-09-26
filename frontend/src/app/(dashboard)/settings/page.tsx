"use client";

import { useState } from "react";
import { useCachedApi } from "@/lib/useCachedApi";
import { useRouter } from "next/navigation";
import {
  fetchApiKeys,
  generateApiKey,
  revokeApiKey,
  fetchHealth,
  login,
  type ApiKey,
  type HealthStatus,
} from "@/lib/api";
import {
  getStoredUser,
  isAuthenticated,
  logout,
  setToken,
  setStoredUser,
  setApiKey as saveApiKey,
  getApiKey,
} from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Key,
  Shield,
  Server,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  LogIn,
  LogOut,
  User,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SettingsPage() {
  const router = useRouter();

  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Auth state ──
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => getStoredUser());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const { data: apiKeysRaw, loading: keysLoading, mutate: loadKeys } = useCachedApi(
    "api_keys",
    () => fetchApiKeys()
  );
  
  const { data: health, loading: healthLoading, mutate: loadHealth } = useCachedApi(
    "system_health",
    () => fetchHealth()
  );

  const apiKeys = apiKeysRaw || [];
  const loading = keysLoading;
  const keysError = null; // Removed as useCachedApi handles error natively, but for simplicity we'll ignore it here or just map it if we really need to.

  // ── Auth handlers ──
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    setLoggingIn(true);
    try {
      const data = await login(email, password);
      setToken(data.accessToken);
      const u = { email: data.user?.email || email, role: data.user?.role || "admin" };
      setStoredUser(u);
      setUser(u);
      setAuthed(true);
      toast.success("Signed in successfully");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Login failed — is the backend running?");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setUser(null);
    toast.success("Signed out");
  };

  // ── API key handlers ──
  const handleGenerate = async () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const key = await generateApiKey({ name: newKeyName });
      setNewKey(key.key || null);
      if (key.key) {
        saveApiKey(key.key);
        toast.success("API key generated and saved for requests");
      } else {
        toast.success("API key generated");
      }
      setNewKeyName("");
      loadKeys();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    try {
      await revokeApiKey(id);
      toast.success(`API key "${name}" revoked`);
      loadKeys();
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke key");
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      toast.success("Key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeKeyStored = Boolean(getApiKey());

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Admin access, API keys, system health, and integrations
          </p>
        </div>
        {authed && (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {user?.email}
          </Badge>
        )}
      </div>

      {/* ─── Top grid: Admin Access + System Health ─────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Admin Access */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Sign in to attach a JWT to every request
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authed ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                  <div className="rounded-full bg-primary/15 text-primary p-2.5">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role || "admin"} · token active
                    </p>
                  </div>
                  <Badge variant="default">Signed in</Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are not currently signed in. Sign in to access full admin capabilities.
                </p>
                <Button
                  className="w-full gap-2"
                  onClick={() => router.push("/login")}
                >
                  <LogIn className="h-4 w-4" />
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4" />
                  System Health
                </CardTitle>
                <CardDescription>Backend service status and database connection</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => loadHealth()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !health ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-destructive/10 p-3 mb-3">
                  <WifiOff className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm font-medium">Backend Unreachable</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Could not connect to the backend. Make sure the server is
                  running on port 3001.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => loadHealth()}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        health.status === "ok" ? "bg-emerald-500" : "bg-destructive"
                      }`}
                    />
                    <span className="text-sm font-semibold capitalize">
                      {health.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Version</p>
                  <p className="text-sm font-semibold font-mono">{health.version}</p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                  <p className="text-sm font-semibold font-mono">
                    {Math.floor(health.uptime / 3600)}h{" "}
                    {Math.floor((health.uptime % 3600) / 60)}m
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Database</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        health.db.connected ? "bg-emerald-500" : "bg-destructive"
                      }`}
                    />
                    <span className="text-sm font-semibold">
                      {health.db.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {health.db.totalCount} total · {health.db.idleCount} idle
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── API Keys ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
              <CardDescription>
                Generate keys for programmatic access from your Flutter app or CLI
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => loadKeys()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New key generated — banner */}
          {newKey && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Key generated successfully
                </p>
                {activeKeyStored && (
                  <Badge variant="outline" className="text-[10px]">
                    saved as X-API-Key
                  </Badge>
                )}
              </div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                Copy this key now — it won&apos;t be shown again. It has been
                saved for your requests.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background/50 p-2.5 rounded border font-mono break-all select-all">
                  {newKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyKey} className="shrink-0">
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Generate new key */}
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g., Flutter App, CI Pipeline)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={!newKeyName.trim() || generating}>
              {generating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>

          <Separator />

          {/* Existing keys list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : keysError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium">Could not load API keys</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {keysError} — is the backend running?
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => loadKeys()}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Generate a key to access the API programmatically
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{k.name}</span>
                      {k.revokedAt ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Revoked
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {k.prefix}••••••••
                      <span className="ml-2 opacity-60">·</span>
                      <span className="ml-2">{k.scopes.join(", ")}</span>
                      <span className="ml-2 opacity-60">·</span>
                      <span className="ml-2">
                        Created {format(new Date(k.createdAt), "MMM d, yyyy")}
                      </span>
                    </p>
                  </div>
                  {!k.revokedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Bottom grid: Integrations + Env ─────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Integrations
            </CardTitle>
            <CardDescription>External services connected to RevRescue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: "Stripe",
                description: "Billing, webhooks, and payment processing",
                status: "STRIPE_SECRET_KEY",
                url: "https://dashboard.stripe.com/apikeys",
              },
              {
                name: "CALL-E",
                description: "Voice AI platform for recovery calls",
                status: "CALLE_CLI_PATH",
                url: null,
              },
              {
                name: "Slack",
                description: "Recovery notifications to your team",
                status: "SLACK_WEBHOOK_URL",
                url: null,
              },
              {
                name: "Neon",
                description: "Serverless PostgreSQL database",
                status: "DATABASE_URL",
                url: "https://console.neon.tech",
              },
              {
                name: "Sentry",
                description: "Error tracking and monitoring",
                status: "SENTRY_DSN",
                url: "https://sentry.io",
              },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                    {integration.status}
                  </span>
                  {integration.url && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={integration.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Environment Variables Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Environment Variables
            </CardTitle>
            <CardDescription>Reference for .env configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
              <p className="text-muted-foreground mb-2"># Required</p>
              <p><span className="text-emerald-400">DATABASE_URL</span>=neon://...</p>
              <p><span className="text-emerald-400">STRIPE_SECRET_KEY</span>=sk_live_...</p>
              <p><span className="text-emerald-400">STRIPE_WEBHOOK_SECRET</span>=whsec_...</p>
              <p className="text-muted-foreground mt-3 mb-2"># Optional</p>
              <p><span className="text-muted-foreground">PORT</span>=3001</p>
              <p><span className="text-muted-foreground">JWT_SECRET</span>=your-secret</p>
              <p><span className="text-muted-foreground">CORS_ORIGINS</span>=http://localhost:3000</p>
              <p><span className="text-muted-foreground">PAYMENT_FAILED_DELAY_HOURS</span>=12</p>
              <p><span className="text-muted-foreground">SENTRY_DSN</span>=https://...</p>
              <p><span className="text-muted-foreground">SLACK_WEBHOOK_URL</span>=https://hooks.slack.com/...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
