"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Menu,
  Activity,
  LogOut,
  RefreshCw,
  User as UserIcon,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar } from "@/components/sidebar";
import {
  getStoredUser,
  isAuthenticated,
  logout,
  setToken,
  setStoredUser,
} from "@/lib/auth";
import { refreshToken } from "@/lib/api";
import { toast } from "sonner";

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setAuthed(isAuthenticated());
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthed(false);
    toast.success("Signed out");
    router.push("/settings");
  };

  const handleRefreshToken = async () => {
    try {
      const data = await refreshToken();
      setToken(data.accessToken);
      setAuthed(true);
      toast.success("Token refreshed");
    } catch (e: any) {
      toast.error(e.message || "Failed to refresh token");
    }
  };

  const initials = (user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6 h-14">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Title (mobile) */}
      <div className="flex-1 lg:hidden">
        <h1 className="text-sm font-bold">RevRescue</h1>
      </div>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block flex-1" />

      {/* Health indicator */}
      <Badge
        variant="outline"
        className="hidden sm:flex items-center gap-1.5 text-xs"
      >
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        System Active
      </Badge>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-9 w-9"
      >
        {mounted && theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* User menu */}
      {!mounted ? (
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      ) : authed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium truncate">
                  {user?.email || "Signed in"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.role || "admin"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleRefreshToken}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh token
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className="gap-1.5"
        >
          <KeyRound className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      )}
    </header>
  );
}
