import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

const schema = z.object({
  identifier: z.string().min(3).max(255),
  password: z.string().min(6).max(100),
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const isEmail = form.identifier.includes("@");
    const { error } = isEmail
      ? await supabase.auth.signInWithPassword({ email: form.identifier, password: form.password })
      : await supabase.auth.signInWithPassword({ phone: form.identifier, password: form.password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex bg-gradient-hero text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2 font-display font-bold text-lg">
          <div className="h-9 w-9 rounded-lg bg-gradient-emerald grid place-items-center shadow-glow"><Building2 className="h-5 w-5" /></div>
          Bank Name
        </Link>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-4">Let's verify our customer</h1>
          <p className="text-white/80 max-w-sm">Login to send money anywhere. Your account is protected with bank-grade security.</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
            <ShieldCheck className="h-5 w-5 text-accent" /> 256-bit encryption · 2FA enabled
          </div>
        </div>
        <p className="relative text-xs text-white/50">Copyright © 2025</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">Email or phone</Label>
            <Input id="id" value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <div className="text-right">
              <button type="button" className="text-xs text-accent hover:underline">Forgot password?</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setForm({ identifier: "", password: "" })}>Clear</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-emerald hover:opacity-90 shadow-glow">
              {loading ? "Signing in…" : "Login"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-accent font-semibold hover:underline">Create an Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
