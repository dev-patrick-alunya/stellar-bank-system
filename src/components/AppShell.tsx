import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { greet } from "@/lib/format";
import { Home, Wallet, ArrowLeftRight, Landmark, PiggyBank, Settings, LogOut, Menu, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/accounts", label: "Accounts", icon: Wallet },
  { to: "/app/transact", label: "Transact", icon: ArrowLeftRight },
  { to: "/app/borrow", label: "Borrow", icon: Landmark },
  { to: "/app/save", label: "Save", icon: PiggyBank },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const quickActions = [
  { to: "/app/transact?action=send", label: "Send Money" },
  { to: "/app/transact?action=bills", label: "Pay Bills" },
  { to: "/app/transact?action=bank", label: "Bank Transfer" },
  { to: "/app/transact?action=own", label: "Own A/C Transfer" },
  { to: "/app/transact?action=withdraw", label: "Withdraw" },
];

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.full_name ?? user.email ?? ""));
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Loading…</div></div>;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-gradient-hero text-white shadow-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/app" className="flex items-center gap-2 font-display font-bold text-lg">
              <div className="h-9 w-9 rounded-lg bg-gradient-emerald grid place-items-center shadow-glow">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span>Bank Name</span>
            </Link>
            <div className="hidden md:block text-sm text-white/85">
              {greet()}, <span className="font-semibold text-white">{name?.split(" ")[0] || "Customer"}</span>
            </div>
            <button className="md:hidden p-2 rounded-md hover:bg-white/10" onClick={() => setOpen(o => !o)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {/* Quick actions */}
          <nav className="hidden md:flex gap-1 pb-3 -mt-1 overflow-x-auto">
            {quickActions.map(a => (
              <Link key={a.to} to={a.to} className="px-3 py-1.5 rounded-md text-xs font-medium text-white/85 bg-white/5 hover:bg-white/15 transition whitespace-nowrap">
                {a.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-0 z-30 bg-sidebar text-sidebar-foreground p-6 pt-20 md:static md:p-0 md:pt-0 md:bg-transparent md:text-foreground md:w-56 md:shrink-0",
          open ? "block" : "hidden md:block"
        )}>
          <nav className="md:sticky md:top-32 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = path === to || (to !== "/app" && path.startsWith(to));
              return (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                    active
                      ? "bg-gradient-emerald text-white shadow-glow"
                      : "text-sidebar-foreground/80 md:text-foreground/70 hover:bg-sidebar-accent md:hover:bg-secondary"
                  )}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 md:text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground">
        Copyright © 2025 Bank Name
      </footer>
    </div>
  );
}
