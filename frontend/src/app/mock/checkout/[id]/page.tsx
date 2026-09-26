"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMockCheckout } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CreditCard, Lock } from "lucide-react";

export default function MockCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const logId = params.id as string;

  const handlePay = async () => {
    setLoading(true);
    try {
      await completeMockCheckout(logId);
      setSuccess(true);
      toast.success("Payment successful!");
    } catch (err: any) {
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <CardTitle className="text-2xl">Payment Successful</CardTitle>
            <CardDescription>
              Thank you! Your account has been updated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can safely close this window now. The RevRescue dashboard has been updated with the recovered MRR.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">RevRescue Client</h1>
        <p className="text-muted-foreground">Secure Checkout</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Update Payment Method</CardTitle>
          <CardDescription>
            Enter your new card details to keep your subscription active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Card Information</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="0000 0000 0000 0000"
                className="pl-9"
                defaultValue="4242 4242 4242 4242"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="MM/YY" defaultValue="12/34" />
              <Input placeholder="CVC" defaultValue="123" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Name on Card</Label>
            <Input placeholder="John Doe" defaultValue="John Doe" />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button onClick={handlePay} disabled={loading} className="w-full h-12 text-lg">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Update Card & Pay"}
          </Button>
          <div className="flex items-center text-xs text-muted-foreground justify-center gap-1">
            <Lock className="w-3 h-3" />
            Payments are secure and encrypted
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
