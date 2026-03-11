import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Send, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "../../../App";
import {
  useCreateNotification,
  useGetAllNotifications,
} from "../../../hooks/useQueries";
import { formatDateTime } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

export default function CoordNotifications({ session: _session }: Props) {
  const { data: notifications, isLoading } = useGetAllNotifications();
  const createNotification = useCreateNotification();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAll, setTargetAll] = useState(true);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      await createNotification.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        targetAll,
      });
      toast.success("Notification sent to all volunteers");
      setTitle("");
      setMessage("");
      setTargetAll(true);
    } catch {
      toast.error("Failed to create notification");
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Notifications</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Create and send announcements to volunteers
        </p>
      </motion.div>

      {/* Create notification form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Create Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body text-sm">Title</Label>
              <Input
                data-ocid="notifications.title_input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="mt-1 font-body"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Message</Label>
              <Textarea
                data-ocid="notifications.message_textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement..."
                rows={3}
                className="mt-1 font-body resize-none"
              />
            </div>
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "oklch(0.97 0.008 140)" }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="font-body text-sm font-medium">
                    Send to All Volunteers
                  </Label>
                  <p className="text-xs text-muted-foreground font-body">
                    All registered volunteers will see this
                  </p>
                </div>
              </div>
              <Switch
                data-ocid="notifications.target_all_switch"
                checked={targetAll}
                onCheckedChange={setTargetAll}
              />
            </div>
            <Button
              data-ocid="notifications.create_button"
              onClick={handleCreate}
              disabled={createNotification.isPending}
              style={{ background: "oklch(0.32 0.09 152)" }}
              className="font-body"
            >
              {createNotification.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sent notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">
                Sent Notifications
              </CardTitle>
              {notifications && (
                <Badge variant="secondary" className="font-body">
                  {notifications.length} total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div
                data-ocid="notifications.empty_state"
                className="text-center py-10"
              >
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body text-sm">
                  No notifications sent yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...notifications]
                  .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                  .map((notif, idx) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.03 * idx }}
                      className="flex items-start gap-3 p-4 rounded-xl border"
                      style={{ background: "oklch(0.99 0.004 90)" }}
                      data-ocid={`notifications.item.${idx + 1}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(0.92 0.03 145)" }}
                      >
                        <Bell
                          className="w-4 h-4"
                          style={{ color: "oklch(0.32 0.09 152)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-body font-semibold">
                            {notif.title}
                          </p>
                          {notif.targetAll && (
                            <Badge
                              variant="secondary"
                              className="font-body text-xs"
                            >
                              All Volunteers
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-body text-muted-foreground mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
