import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: Register,
});

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  nationalId: z.string().trim().min(4).max(30),
  bankAccountNo: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(100),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

const initial = { fullName: "", email: "", phone: "", nationalId: "", bankAccountNo: "", password: "", confirm: "" };

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initial);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          full_name: form.fullName,
          phone: form.phone,
          national_id: form.nationalId,
          bank_account_no: form.bankAccountNo,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Welcome to Bank Name.");
    navigate({ to: "/app" });
  };

  const fields: { id: keyof typeof initial; label: string; type?: string; placeholder?: string }[] = [
    { id: "fullName", label: "Account Name", placeholder: "John Doe" },
    { id: "email", label: "Email Id", type: "email", placeholder: "you@example.com" },
    { id: "phone", label: "Phone No.", placeholder: "+254 700 000 000" },
    { id: "nationalId", label: "National Id No.", placeholder: "12345678" },
    { id: "bankAccountNo", label: "Bank Account No.", placeholder: "1234567890" },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
    { id: "confirm", label: "Confirm Password", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex bg-gradient-hero text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2 font-display font-bold text-lg">
          <div className="h-9 w-9 rounded-lg bg-gradient-emerald grid place-items-center shadow-glow"><Building2 className="h-5 w-5" /></div>
          Bank Name
        </Link>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-4">Let's secure your bank details</h1>
          <p className="text-white/80 max-w-sm">Register to experience our services. Your details are protected with end-to-end encryption.</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
            <ShieldCheck className="h-5 w-5 text-accent" /> Your data is safe with us
          </div>
        </div>
        <p className="relative text-xs text-white/50">Copyright © 2025</p>
      </div>

      <div className="flex items-center justify-center p-6 py-10">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
          <div>
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="text-muted-foreground mt-1">Join in under a minute</p>
          </div>

          {fields.map(f => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input id={f.id} type={f.type ?? "text"} placeholder={f.placeholder}
                value={form[f.id]} onChange={e => setForm({ ...form, [f.id]: e.target.value })} />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setForm(initial)}>Clear</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-emerald hover:opacity-90 shadow-glow">
              {loading ? "Creating…" : "Create Account"}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-accent font-semibold hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
