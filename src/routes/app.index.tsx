import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Landmark } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

type Stats = { totalBalance: number; monthlyIncome: number; totalDebts: number; monthlyOut: number };

function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalBalance: 0, monthlyIncome: 0, totalDebts: 0, monthlyOut: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0);
      const [{ data: accs }, { data: txns }, { data: loans }] = await Promise.all([
        supabase.from("accounts").select("balance,account_type").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).gte("created_at", startMonth.toISOString()),
        supabase.from("loans").select("outstanding_balance").eq("user_id", user.id).eq("status", "active"),
      ]);
      const totalBalance = (accs ?? []).filter(a => a.account_type !== "loan").reduce((s, a) => s + Number(a.balance), 0);
      const totalDebts = (loans ?? []).reduce((s, l) => s + Number(l.outstanding_balance), 0);
      const incomeTypes = ["deposit","loan_disbursement","interest"];
      const monthlyIncome = (txns ?? []).filter(t => incomeTypes.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
      const monthlyOut = (txns ?? []).filter(t => !incomeTypes.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
      setStats({ totalBalance, monthlyIncome, totalDebts, monthlyOut });

      const { data: rec } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
      setRecent(rec ?? []);
    })();
  }, [user]);

  const tiles = [
    { label: "Total Account Balance", value: stats.totalBalance, icon: Wallet, accent: true },
    { label: "Total Monthly Income", value: stats.monthlyIncome, icon: TrendingUp },
    { label: "Total Debts", value: stats.totalDebts, icon: Landmark },
    { label: "Money Out This Month", value: stats.monthlyOut, icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Here's what's happening with your money this month.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <Card key={i} className={`p-5 shadow-card border-0 ${t.accent ? "bg-gradient-hero text-white" : "bg-card"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${t.accent ? "text-white/70" : "text-muted-foreground"}`}>{t.label}</p>
                <p className="text-2xl font-bold mt-2">{formatKES(t.value)}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${t.accent ? "bg-white/15" : "bg-accent/10 text-accent"}`}>
                <t.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-card border-0">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet. Make your first transfer from the Transact page.</p>
        ) : (
          <div className="divide-y">
            {recent.map(t => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{t.type.replace(/_/g," ")}</p>
                  <p className="text-xs text-muted-foreground">{t.recipient ?? t.description ?? "—"} · {new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-semibold ${["deposit","loan_disbursement","interest"].includes(t.type) ? "text-success" : "text-foreground"}`}>
                  {["deposit","loan_disbursement","interest"].includes(t.type) ? "+" : "−"} {formatKES(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
