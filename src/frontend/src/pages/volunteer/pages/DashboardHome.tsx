import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";
import { motion } from "motion/react";
import type { AuthSession } from "../../../App";
import {
  useGetMyTotalServiceHours,
  useGetUnreadNotificationCount,
  useGetUpcomingEvents,
} from "../../../hooks/useQueries";
import { formatDate, getStatusColor } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
  onNavigate: (page: string) => void;
}

export default function VolunteerDashboardHome({ session, onNavigate }: Props) {
  const { data: upcomingEvents, isLoading: loadingEvents } =
    useGetUpcomingEvents();
  const { data: totalHours, isLoading: loadingHours } =
    useGetMyTotalServiceHours();
  const { data: unreadCount } = useGetUnreadNotificationCount();

  const stats = [
    {
      label: "Upcoming Events",
      value: loadingEvents ? "—" : String(upcomingEvents?.length ?? 0),
      icon: Calendar,
      color: "oklch(0.55 0.15 240)",
      bg: "oklch(0.93 0.04 240)",
    },
    {
      label: "Total Service Hours",
      value: loadingHours ? "—" : String(Number(totalHours ?? BigInt(0))),
      icon: Clock,
      color: "oklch(0.38 0.1 152)",
      bg: "oklch(0.92 0.03 145)",
    },
    {
      label: "Unread Notifications",
      value: String(Number(unreadCount ?? BigInt(0))),
      icon: Bell,
      color: "oklch(0.55 0.16 85)",
      bg: "oklch(0.94 0.06 90)",
    },
  ];

  return (
    <div className="page-container">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome, {session.name}!
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Here's your NSS activity overview
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <Card className="stat-card shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: stat.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-body">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">
                Upcoming Events
              </CardTitle>
              <button
                type="button"
                onClick={() => onNavigate("events")}
                className="text-xs font-body flex items-center gap-1 hover:underline"
                style={{ color: "oklch(0.32 0.09 152)" }}
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !upcomingEvents || upcomingEvents.length === 0 ? (
              <div data-ocid="events.empty_state" className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground font-body text-sm">
                  No upcoming events
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/40"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-display font-bold"
                      style={{
                        background: "oklch(0.92 0.03 145)",
                        color: "oklch(0.28 0.09 152)",
                      }}
                    >
                      {formatDate(event.date).split(" ")[0]}
                      <br />
                      {formatDate(event.date).split(" ")[1]?.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {event.location}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs font-body flex-shrink-0 ${getStatusColor(event.status)}`}
                      variant="outline"
                    >
                      {event.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Hours Progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Service Hours Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHours ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-body">
                  Loading...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-muted-foreground">
                    Total Hours Completed
                  </span>
                  <span
                    className="text-lg font-display font-bold"
                    style={{ color: "oklch(0.32 0.09 152)" }}
                  >
                    {Number(totalHours ?? BigInt(0))} hrs
                  </span>
                </div>
                <div
                  className="h-2.5 rounded-full overflow-hidden"
                  style={{ background: "oklch(0.92 0.03 145)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (Number(totalHours ?? BigInt(0)) / 120) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full rounded-full"
                    style={{ background: "oklch(0.32 0.09 152)" }}
                  />
                </div>
                <p className="text-xs font-body text-muted-foreground">
                  {Number(totalHours ?? BigInt(0))} of 120 hours for full
                  certification
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
