import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES, maskAccount } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/accounts")({
  component: AccountsPage,
});

const externalOpts = [
  { type: "external_paypal" as const, name: "Paypal" },
  { type: "external_payoneer" as const, name: "Payoneer" },
];

function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at");
    setAccounts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const linkExternal = async (type: "external_paypal" | "external_payoneer", name: string) => {
    if (!user) return;
    const handle = window.prompt(`Enter your ${name} ${type === "external_paypal" ? "email" : "user id"}`);
    if (!handle) return;
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      account_number: handle.slice(0, 24),
      account_name: name,
      account_type: type,
      external_identifier: handle,
      balance: 0,
    });
    if (error) return toast.error(error.message);
    toast.success(`${name} linked`);
    load();
  };

  const internal = accounts.filter(a => !a.account_type.startsWith("external_"));
  const external = accounts.filter(a => a.account_type.startsWith("external_"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Accounts</h1>
        <p className="text-muted-foreground">All your accounts in one place.</p>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {internal.map(a => (
              <Card key={a.id} className="p-6 shadow-card border-0 bg-gradient-card text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/60">{a.account_name}</p>
                    <p className="text-2xl font-bold mt-1">{formatKES(a.balance)}</p>
                  </div>
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <div className="relative mt-8 flex items-center justify-between text-sm">
                  <span className="font-mono tracking-widest">{maskAccount(a.account_number)}</span>
                  <span className="text-white/60 capitalize">{a.account_type.replace(/_/g," ")}</span>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Other Accounts</h2>
              <div className="flex gap-2">
                {externalOpts.map(o => (
                  <Button key={o.type} size="sm" variant="outline" onClick={() => linkExternal(o.type, o.name)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Link {o.name}
                  </Button>
                ))}
              </div>
            </div>
            {external.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
                No external accounts linked yet.
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {external.map(a => (
                  <Card key={a.id} className="p-5 shadow-card border-0">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">{a.account_name}</p>
                    <p className="text-sm mt-1">{a.external_identifier}</p>
                    <p className="text-xl font-bold mt-3">{formatKES(a.balance)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
