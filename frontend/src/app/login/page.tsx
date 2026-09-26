"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { setToken, setStoredUser } from "@/lib/auth";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      toast.success("Signed in successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed — is the backend running?");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding (Black Container) */}
      <div className="hidden lg:flex flex-col w-1/2 bg-black p-12 text-white justify-between relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="rounded bg-primary text-primary-foreground p-1">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">RevRescue</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Recover lost revenue automatically
          </h1>
          <p className="text-zinc-400 text-lg max-w-md">
            AI-powered voice recovery platform designed to retain SaaS revenue and engage customers proactively.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center justify-between text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} RevRescue Inc.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@revrescue.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loggingIn}>
              {loggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
