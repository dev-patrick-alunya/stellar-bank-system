import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

export const Route = createFileRoute("/app/borrow")({
  component: BorrowPage,
});

const products = [
  { type: "one_month" as const, name: "1 Month Loan", limit: 50000, rate: 2, term: 1 },
  { type: "business_plus" as const, name: "Business Plus Loan", limit: 2000000, rate: 20, term: 12 },
  { type: "one_year" as const, name: "1 Year Loan", limit: 500000, rate: 10, term: 12 },
];

function BorrowPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<typeof products[number] | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("loans").select("*").eq("user_id", user.id).order("disbursed_at", { ascending: false });
    setLoans(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > active.limit) return toast.error(`Exceeds limit of ${formatKES(active.limit)}`);
    setSubmitting(true);

    const interest = amt * (active.rate / 100);
    const total = amt + interest;
    const due = new Date(); due.setMonth(due.getMonth() + active.term);

    const { error: lErr } = await supabase.from("loans").insert({
      user_id: user.id,
      loan_type: active.type,
      principal: amt,
      interest_rate: active.rate,
      term_months: active.term,
      outstanding_balance: total,
      status: "active",
      due_at: due.toISOString(),
    });

    if (!lErr) {
      // credit primary account
      const { data: primary } = await supabase.from("accounts").select("*").eq("user_id", user.id).eq("account_type", "primary").maybeSingle();
      if (primary) {
        await supabase.from("accounts").update({ balance: Number(primary.balance) + amt }).eq("id", primary.id);
        await supabase.from("transactions").insert({
          user_id: user.id, account_id: primary.id, type: "loan_disbursement", amount: amt,
          description: `${active.name} disbursement`, status: "completed",
        });
      }
    }
    setSubmitting(false);
    if (lErr) return toast.error(lErr.message);
    toast.success("Loan approved & disbursed!");
    setActive(null); setAmount("");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Borrow</h1>
        <p className="text-muted-foreground">Quick loans for every need.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {products.map(p => (
          <Card key={p.type} className="p-6 shadow-card border-0 relative overflow-hidden group hover:shadow-glow transition">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition" />
            <div className="relative">
              <div className="h-11 w-11 rounded-lg bg-gradient-emerald grid place-items-center text-white shadow-glow mb-4">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Loan limit</p>
              <p className="text-2xl font-bold">{formatKES(p.limit)}</p>
              <p className="text-sm text-accent font-semibold mt-2">{p.rate}% Interest Rate</p>
              <Button onClick={() => setActive(p)} className="mt-4 w-full bg-gradient-emerald hover:opacity-90">Apply</Button>
            </div>
          </Card>
        ))}
      </div>

      {active && (
        <Card className="p-6 shadow-card border-0">
          <h2 className="text-lg font-semibold mb-4">Apply for {active.name}</h2>
          <form onSubmit={apply} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label>Amount (max {formatKES(active.limit)})</Label>
              <Input type="number" min="1" max={active.limit} value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="text-sm text-muted-foreground">
              Repayable: <span className="font-semibold text-foreground">{amount ? formatKES(Number(amount) * (1 + active.rate/100)) : "—"}</span> over {active.term} month(s).
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setActive(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-emerald hover:opacity-90 shadow-glow">
                {submitting ? "Processing…" : "Confirm & Disburse"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6 shadow-card border-0">
        <h2 className="text-lg font-semibold mb-4">My Loans</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No loans yet.</p>
        ) : (
          <div className="divide-y">
            {loans.map(l => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{l.loan_type.replace(/_/g," ")}</p>
                  <p className="text-xs text-muted-foreground">Disbursed {new Date(l.disbursed_at).toLocaleDateString()} · Due {new Date(l.due_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatKES(l.outstanding_balance)}</p>
                  <p className="text-xs text-muted-foreground">at {l.interest_rate}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
