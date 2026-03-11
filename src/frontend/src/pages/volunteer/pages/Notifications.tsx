import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  useGetAllNotifications,
  useMarkNotificationAsRead,
} from "../../../hooks/useQueries";
import { formatDateTime } from "../../../lib/helpers";

export default function VolunteerNotifications() {
  const { data: notifications, isLoading } = useGetAllNotifications();
  const markRead = useMarkNotificationAsRead();

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark as read");
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
          Announcements from coordinators
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">
                All Notifications
              </CardTitle>
              {notifications && notifications.length > 0 && (
                <Badge variant="secondary" className="font-body">
                  {notifications.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div
                data-ocid="notifications.empty_state"
                className="text-center py-10"
              >
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, idx) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * idx }}
                    className="flex items-start gap-3 p-4 rounded-xl border transition-colors"
                    style={{ background: "oklch(0.99 0.004 90)" }}
                    data-ocid={`notifications.item.${idx + 1}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "oklch(0.92 0.03 145)" }}
                    >
                      <Bell
                        className="w-4 h-4"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-foreground">
                        {notif.title}
                      </p>
                      <p className="text-sm font-body text-muted-foreground mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {formatDateTime(notif.createdAt)}
                      </p>
                    </div>
                    <Button
                      data-ocid={`notifications.mark_read_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="font-body flex-shrink-0 text-xs"
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={markRead.isPending}
                    >
                      {markRead.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCheck className="w-3 h-3 mr-1" /> Read
                        </>
                      )}
                    </Button>
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
