import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Receipt, Building, ArrowLeftRight, Wallet, Smartphone, Users, Bitcoin, Phone } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/app/transact")({
  component: TransactPage,
});

const ops = [
  { id: "send_money", label: "Send Money To Phone", icon: Phone, group: "send", needsRecipient: "Phone number" },
  { id: "bank_transfer", label: "Transfer To Same Bank", icon: Building, group: "bank", needsRecipient: "Bank account no." },
  { id: "bank_transfer", label: "Transfer To Other Banks", icon: Building, group: "bank", needsRecipient: "Bank + account no.", key: "bank_other" },
  { id: "own_transfer", label: "Transfer To Own A/C", icon: ArrowLeftRight, group: "own", needsRecipient: null },
  { id: "pay_bill", label: "Pay Bills", icon: Receipt, group: "bills", needsRecipient: "Biller / Account" },
  { id: "withdraw_mpesa", label: "Withdraw To Mpesa", icon: Smartphone, group: "withdraw", needsRecipient: "Mpesa number" },
  { id: "withdraw_agent", label: "Withdraw Via Agent", icon: Users, group: "withdraw", needsRecipient: "Agent ID" },
  { id: "withdraw_crypto", label: "Withdraw To Crypto Wallet", icon: Bitcoin, group: "withdraw", needsRecipient: "Wallet address" },
  { id: "buy_airtime", label: "Buy Airtime", icon: Send, group: "send", needsRecipient: "Phone number" },
] as const;

const schema = z.object({
  amount: z.number().positive().max(10_000_000),
  recipient: z.string().max(120).optional(),
  description: z.string().max(200).optional(),
  fromAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional(),
});

function TransactPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [op, setOp] = useState<typeof ops[number] | null>(null);
  const [form, setForm] = useState({ amount: "", recipient: "", description: "", fromAccountId: "", destinationAccountId: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    setAccounts(data ?? []);
    if (data?.[0]) setForm(f => ({ ...f, fromAccountId: f.fromAccountId || data[0].id }));
  };
  useEffect(() => { load(); }, [user]);

  const fromAcc = useMemo(() => accounts.find(a => a.id === form.fromAccountId), [accounts, form.fromAccountId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !op) return;
    const parsed = schema.safeParse({
      amount: Number(form.amount),
      recipient: form.recipient || undefined,
      description: form.description || undefined,
      fromAccountId: form.fromAccountId,
      destinationAccountId: op.group === "own" ? form.destinationAccountId : undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!fromAcc) return toast.error("Select a source account");
    if (parsed.data.amount > Number(fromAcc.balance)) return toast.error("Insufficient balance");

    setSubmitting(true);
    // Debit source
    const newBal = Number(fromAcc.balance) - parsed.data.amount;
    const { error: updErr } = await supabase.from("accounts").update({ balance: newBal }).eq("id", fromAcc.id);
    if (updErr) { setSubmitting(false); return toast.error(updErr.message); }

    // Credit destination if own_transfer
    if (op.group === "own" && parsed.data.destinationAccountId) {
      const dest = accounts.find(a => a.id === parsed.data.destinationAccountId);
      if (dest) {
        await supabase.from("accounts").update({ balance: Number(dest.balance) + parsed.data.amount }).eq("id", dest.id);
      }
    }

    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: fromAcc.id,
      destination_account_id: parsed.data.destinationAccountId ?? null,
      type: op.id as any,
      amount: parsed.data.amount,
      recipient: parsed.data.recipient ?? null,
      description: parsed.data.description ?? null,
      status: "completed",
    });
    setSubmitting(false);
    if (txErr) return toast.error(txErr.message);
    toast.success(`${op.label} successful`);
    setForm({ ...form, amount: "", recipient: "", description: "", destinationAccountId: "" });
    setOp(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transact</h1>
        <p className="text-muted-foreground">Move money your way.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ops.map((o, i) => (
          <button key={(o as any).key ?? `${o.id}-${i}`} onClick={() => setOp(o)}
            className="text-left p-5 rounded-xl border bg-card hover:border-accent hover:shadow-card transition group">
            <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent grid place-items-center mb-3 group-hover:bg-gradient-emerald group-hover:text-white transition">
              <o.icon className="h-5 w-5" />
            </div>
            <p className="font-semibold">{o.label}</p>
          </button>
        ))}
      </div>

      {op && (
        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{op.label}</h2>
            <Button variant="ghost" size="sm" onClick={() => setOp(null)}>Cancel</Button>
          </div>
          <form onSubmit={submit} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label>From account</Label>
              <Select value={form.fromAccountId} onValueChange={v => setForm({ ...form, fromAccountId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type !== "loan").map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.account_name} — {formatKES(a.balance)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {op.group === "own" && (
              <div className="space-y-1.5">
                <Label>To account</Label>
                <Select value={form.destinationAccountId} onValueChange={v => setForm({ ...form, destinationAccountId: v })}>
                  <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id !== form.fromAccountId).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {op.needsRecipient && (
              <div className="space-y-1.5">
                <Label>{op.needsRecipient}</Label>
                <Input value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Amount (KES)</Label>
              <Input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-gradient-emerald hover:opacity-90 shadow-glow">
              {submitting ? "Processing…" : `Confirm ${op.label}`}
            </Button>
          </form>
        </Card>
      )}

      {!op && (
        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" /> Pick an action above to get started.
          </div>
        </Card>
      )}
    </div>
  );
}
