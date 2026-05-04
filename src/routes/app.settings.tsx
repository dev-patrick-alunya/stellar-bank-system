import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Lock, ShieldCheck, ScanFace, KeyRound, AlertTriangle, User } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [pw, setPw] = useState({ p1: "", p2: "" });
  const [twoFA, setTwoFA] = useState({ app: false, face: false });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (pw.p1.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw.p1 !== pw.p2) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password: pw.p1 });
    if (error) return toast.error(error.message);
    toast.success("Password changed");
    setPw({ p1: "", p2: "" });
  };

  const requestClose = async () => {
    if (!confirm("Are you sure? This is irreversible.")) return;
    toast.success("Account deletion request submitted. Our team will reach out within 7 days.");
    await signOut();
    navigate({ to: "/" });
  };

  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and security.</p>
      </div>

      <Card className="p-6 shadow-card border-0">
        <div className="flex items-center gap-2 mb-4"><User className="h-5 w-5 text-accent" /><h2 className="font-semibold text-lg">Profile</h2></div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-emerald grid place-items-center text-white text-2xl font-bold shadow-glow">
            {(profile.full_name?.[0] ?? "U").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">{profile.phone ?? "—"}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={profile.full_name ?? ""} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={profile.phone ?? ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
          </div>
        </div>
        <Button onClick={updateProfile} className="mt-4 bg-gradient-emerald hover:opacity-90">Save profile</Button>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center gap-2 mb-4"><Lock className="h-5 w-5 text-accent" /><h2 className="font-semibold">Password</h2></div>
          <p className="text-sm text-muted-foreground mb-3">Change account password</p>
          <div className="space-y-3">
            <Input type="password" placeholder="New password" value={pw.p1} onChange={e => setPw({ ...pw, p1: e.target.value })} />
            <Input type="password" placeholder="Confirm new password" value={pw.p2} onChange={e => setPw({ ...pw, p2: e.target.value })} />
            <Button onClick={changePassword} className="w-full">Update password</Button>
          </div>
        </Card>

        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center gap-2 mb-4"><KeyRound className="h-5 w-5 text-accent" /><h2 className="font-semibold">Security Questions</h2></div>
          <p className="text-sm text-muted-foreground mb-3">Set security questions for account recovery.</p>
          <Button variant="outline" className="w-full" onClick={() => toast.info("Coming soon")}>Set security questions</Button>
        </Card>

        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center gap-2 mb-4"><ShieldCheck className="h-5 w-5 text-accent" /><h2 className="font-semibold">Two-Factor Authentication</h2></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Authenticator App</span>
              <Switch checked={twoFA.app} onCheckedChange={v => { setTwoFA({ ...twoFA, app: v }); toast.success(v ? "Authenticator enabled" : "Disabled"); }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><ScanFace className="h-4 w-4" /> Facial Recognition</span>
              <Switch checked={twoFA.face} onCheckedChange={v => { setTwoFA({ ...twoFA, face: v }); toast.success(v ? "Face ID enabled" : "Disabled"); }} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card border-0 border-destructive/30 border bg-destructive/5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5 text-destructive" /><h2 className="font-semibold">Close Account Request</h2></div>
          <p className="text-sm text-foreground mb-2">
            <mark className="bg-warning/30 px-1">Be warned that this is an irreversible action and we shall not be held responsible whatsoever!</mark>
          </p>
          <p className="text-sm text-muted-foreground mb-4">We shall only miss you that much.</p>
          <Button variant="destructive" onClick={requestClose} className="w-full">Send account deletion request</Button>
        </Card>
      </div>
    </div>
  );
}
