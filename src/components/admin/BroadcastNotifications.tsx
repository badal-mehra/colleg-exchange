import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileLite {
  user_id: string;
  full_name: string;
  email: string;
}

interface Props {
  profiles: ProfileLite[];
}

export const BroadcastNotifications: React.FC<Props> = ({ profiles }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/dashboard");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (target === "user" && !targetUserId) {
      toast({ title: "Select a user", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.rpc("admin_broadcast_notification", {
      p_title: title.trim(),
      p_body: body.trim() || null,
      p_url: url.trim() || "/dashboard",
      p_target_user_id: target === "user" ? targetUserId : null,
    });
    setSending(false);
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      return;
    }
    const recipients = (data as { recipients?: number })?.recipients ?? 0;
    toast({
      title: "Notification sent",
      description: `Delivered to ${recipients} user${recipients === 1 ? "" : "s"}.`,
    });
    setTitle("");
    setBody("");
    setUrl("/dashboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Audience</Label>
          <Select value={target} onValueChange={(v) => setTarget(v as "all" | "user")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="user">Specific user</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {target === "user" && (
          <div className="grid gap-2">
            <Label>User</Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger><SelectValue placeholder="Choose user" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {profiles.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.full_name || "Unnamed"} — {p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-2">
          <Label>Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Big sale this weekend!"
            maxLength={100}
          />
        </div>

        <div className="grid gap-2">
          <Label>Message</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification body…"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="grid gap-2">
          <Label>Link (optional)</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/dashboard"
          />
          <p className="text-xs text-muted-foreground">
            Where users land when tapping the notification.
          </p>
        </div>

        <Button onClick={send} disabled={sending} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Sending…" : target === "all" ? "Send to all users" : "Send notification"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BroadcastNotifications;
