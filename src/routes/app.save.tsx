import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES, maskAccount } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PiggyBank } from "lucide-react";

export const Route = createFileRoute("/app/save")({
  component: SavePage,
});

const products = [
  { type: "savings_classic" as const, name: "Classic Saving Account", rate: 10 },
  { type: "savings_family" as const, name: "Family Savings Account", rate: 20 },
  { type: "savings_kids" as const, name: "Kids Saving Account", rate: 10 },
  { type: "savings_assets" as const, name: "Assets Savings Account", rate: 20 },
];

function SavePage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [opening, setOpening] = useState<typeof products[number] | null>(null);
  const [deposit, setDeposit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    setAccounts(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const open = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !opening) return;
    const amt = Number(deposit || 0);
    if (amt < 0) return toast.error("Invalid amount");
    setSubmitting(true);

    const acc_no = String(Math.floor(Math.random() * 1e10)).padStart(10, "0");
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id, account_number: acc_no, account_name: opening.name,
      account_type: opening.type, balance: amt, interest_rate: opening.rate,
    });

    if (!error && amt > 0) {
      const { data: primary } = await supabase.from("accounts").select("*").eq("user_id", user.id).eq("account_type", "primary").maybeSingle();
      if (primary && Number(primary.balance) >= amt) {
        await supabase.from("accounts").update({ balance: Number(primary.balance) - amt }).eq("id", primary.id);
      }
    }
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(`${opening.name} opened`);
    setOpening(null); setDeposit("");
    load();
  };

  const existing = accounts.filter(a => a.account_type.startsWith("savings_"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Save</h1>
        <p className="text-muted-foreground">Grow your money with high-interest savings.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {products.map(p => {
          const owned = existing.find(a => a.account_type === p.type);
          return (
            <Card key={p.type} className="p-6 shadow-card border-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-11 w-11 rounded-lg bg-gradient-emerald grid place-items-center text-white shadow-glow mb-3">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  {owned ? (
                    <>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">A/C {maskAccount(owned.account_number)}</p>
                      <p className="text-2xl font-bold mt-2">{formatKES(owned.balance)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Not opened yet</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Interest</p>
                  <p className="text-2xl font-bold text-accent">{p.rate}%</p>
                </div>
              </div>
              {!owned && (
                <Button onClick={() => setOpening(p)} className="mt-4 w-full bg-gradient-emerald hover:opacity-90">Open Account</Button>
              )}
            </Card>
          );
        })}
      </div>

      {opening && (
        <Card className="p-6 shadow-card border-0">
          <h2 className="text-lg font-semibold mb-4">Open {opening.name}</h2>
          <form onSubmit={open} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label>Initial deposit (optional, KES)</Label>
              <Input type="number" min="0" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground">Funded from your Primary Account.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpening(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-emerald hover:opacity-90 shadow-glow">
                {submitting ? "Opening…" : "Open Account"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
