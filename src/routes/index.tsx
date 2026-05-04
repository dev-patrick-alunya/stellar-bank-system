import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Zap, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && user) navigate({ to: "/app" }); }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute top-0 inset-x-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-display font-bold">
            <div className="h-9 w-9 rounded-lg bg-gradient-emerald grid place-items-center shadow-glow">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Bank Name</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login"><Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Login</Button></Link>
            <Link to="/register"><Button className="bg-gradient-emerald hover:opacity-90 shadow-glow">Open Account</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative bg-gradient-hero text-white pt-32 pb-24 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-accent font-semibold mb-3 tracking-wide uppercase text-xs">Modern Banking, Reimagined</p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">Bank smarter. <br /><span className="text-accent">Live freer.</span></h1>
            <p className="text-white/80 text-lg max-w-md mb-8">Send, save, borrow and grow — all from one secure account. Welcome to banking built for everyday life.</p>
            <div className="flex gap-3">
              <Link to="/register"><Button size="lg" className="bg-gradient-emerald hover:opacity-90 shadow-glow text-base">Create your account</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">I have an account</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "Bank-grade security", desc: "End-to-end encryption & 2FA." },
              { icon: Zap, title: "Instant transfers", desc: "Send money in seconds." },
              { icon: PiggyBank, title: "Smart savings", desc: "Up to 20% interest." },
              { icon: Building2, title: "Multi-account", desc: "Link Paypal, Payoneer, more." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white/10 backdrop-blur p-5 border border-white/10">
                <f.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-white/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted-foreground">Copyright © 2025 Bank Name</footer>
    </div>
  );
}
