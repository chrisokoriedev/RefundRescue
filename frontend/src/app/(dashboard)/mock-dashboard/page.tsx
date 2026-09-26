"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { triggerMockWebhook } from "@/lib/api";
import { 
  onCallStarted, 
  onCallStatus, 
  onCallCompleted, 
  onSmsSent,
  connectDashboard,
  disconnectDashboard,
  CallEvent,
  SmsEvent
} from "@/lib/socket";
import { toast } from "sonner";
import { Loader2, Activity, Phone, PhoneCall, CheckCircle2, MessageSquare } from "lucide-react";

// Union of everything shown in the live feed, discriminated by kind
type LiveEvent =
  | { kind: "call"; data: CallEvent }
  | { kind: "sms"; data: SmsEvent };

export default function MockDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [formData, setFormData] = useState({
    customerName: "John Doe",
    phone: "+15550192831",
    email: "john@example.com",
    mrr: "500",
    hasSavedCard: "yes",
    eventType: "invoice.payment_failed",
  });

  useEffect(() => {
    connectDashboard();

    const addCall = (e: CallEvent) => {
      setEvents((prev) => [{ kind: "call", data: e }, ...prev]);
    };
    const addSms = (e: SmsEvent) => {
      setEvents((prev) => [{ kind: "sms", data: e }, ...prev]);
    };

    const unsubStart = onCallStarted(addCall);
    const unsubStatus = onCallStatus(addCall);
    const unsubComplete = onCallCompleted(addCall);
    const unsubSms = onSmsSent(addSms);

    return () => {
      unsubStart();
      unsubStatus();
      unsubComplete();
      unsubSms();
      // disconnectDashboard(); // Optional: keep alive for other pages
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      await triggerMockWebhook({
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        mrr: Number(formData.mrr),
        hasSavedCard: formData.hasSavedCard === "yes",
        eventType: formData.eventType,
      });
      toast.success("Mock webhook triggered successfully! Call initiated.");
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "in_progress") return <PhoneCall className="h-4 w-4 text-blue-500 animate-pulse" />;
    if (status === "recovered" || status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Phone className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mock Webhook Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Simulate Stripe events to test the RevRescue call flow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulate Event</CardTitle>
            <CardDescription>
              Enter mock customer details and trigger a fake Stripe webhook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>MRR Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.mrr}
                  onChange={(e) => handleChange("mrr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(v) => handleChange("eventType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice.payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="customer.subscription.deleted">Subscription Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Has Saved Card?</Label>
                <Select
                  value={formData.hasSavedCard}
                  onValueChange={(v) => handleChange("hasSavedCard", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSimulate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Trigger Webhook
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full max-h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Activity</CardTitle>
                <CardDescription>
                  Real-time calls, SMS fallbacks & metrics
                </CardDescription>
              </div>
              <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {events.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic">
                  Waiting for events... Trigger a webhook to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((evt, idx) =>
                    evt.kind === "sms" ? (
                      <div key={idx} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                        <div className="mt-0.5">
                          <MessageSquare className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                              SMS
                            </span>
                            <span className="font-medium text-foreground truncate">
                              {evt.data.customerName || evt.data.phone}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(evt.data.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">${evt.data.amount}</span> payment link → {evt.data.phone}
                          <span
                            className={`ml-2 text-xs font-medium ${
                              evt.data.delivered
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            · {evt.data.delivered ? "Delivered" : "Dev log — Twilio not configured"}
                          </span>
                        </div>
                          <a
                            href={evt.data.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-primary underline break-all"
                          >
                            {evt.data.paymentUrl}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div key={idx} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                        <div className="mt-0.5">
                          {getStatusIcon(evt.data.status)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">
                              {evt.data.customerName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(evt.data.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Status: <span className="font-medium capitalize">{evt.data.status.replace("_", " ")}</span>
                          </div>
                          {evt.data.outcome && (
                            <div className="text-xs bg-muted p-2 rounded-md mt-1 font-mono">
                              {evt.data.outcome}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
