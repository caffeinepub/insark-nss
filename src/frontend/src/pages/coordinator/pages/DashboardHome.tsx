import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, CheckSquare, Database, Loader2, Users } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { AuthSession } from "../../../App";
import { formatDate, getStatusColor } from "../../../lib/helpers";
import {
  useGetAllAttendanceCount,
  useGetAllEvents,
  useGetAllVolunteers,
  useSeedSampleData,
} from "./dashboardHelpers";

interface Props {
  session: AuthSession;
}

// Helper hook that uses the real hooks
function useDashboardData() {
  const { data: volunteers, isLoading: loadingVols } = useGetAllVolunteers();
  const { data: events, isLoading: loadingEvents } = useGetAllEvents();
  const seedData = useSeedSampleData();

  return { volunteers, events, loadingVols, loadingEvents, seedData };
}

export default function CoordDashboardHome({ session }: Props) {
  const { volunteers, events, loadingVols, loadingEvents, seedData } =
    useDashboardData();

  const handleSeed = async () => {
    try {
      await seedData.mutateAsync();
      toast.success("Sample data seeded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed data";
      toast.error(
        msg.includes("admin") || msg.includes("Unauthorized")
          ? "Seed requires admin privileges"
          : msg,
      );
    }
  };

  const stats = [
    {
      label: "Total Volunteers",
      value: loadingVols ? "—" : String(volunteers?.length ?? 0),
      icon: Users,
      color: "oklch(0.32 0.09 152)",
      bg: "oklch(0.92 0.03 145)",
    },
    {
      label: "Total Events",
      value: loadingEvents ? "—" : String(events?.length ?? 0),
      icon: Calendar,
      color: "oklch(0.55 0.15 240)",
      bg: "oklch(0.93 0.04 240)",
    },
    {
      label: "Upcoming Events",
      value: loadingEvents
        ? "—"
        : String(
            events?.filter((e) => e.status.toLowerCase() === "upcoming")
              .length ?? 0,
          ),
      icon: CheckSquare,
      color: "oklch(0.55 0.16 85)",
      bg: "oklch(0.94 0.06 90)",
    },
  ];

  const recentEvents = [...(events ?? [])]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 5);

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">
            Coordinator Dashboard
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Welcome back, {session.name}
          </p>
        </div>
        <Button
          data-ocid="dashboard.seed_button"
          variant="outline"
          size="sm"
          onClick={handleSeed}
          disabled={seedData.isPending}
          className="font-body text-xs"
        >
          {seedData.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5 mr-1.5" />
          )}
          Seed Sample Data
        </Button>
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
              transition={{ delay: 0.05 * i }}
            >
              <Card className="stat-card shadow-card">
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
                      {loadingVols || loadingEvents ? (
                        <Skeleton className="h-7 w-12 mt-1" />
                      ) : (
                        <p className="text-2xl font-display font-bold">
                          {stat.value}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : recentEvents.length === 0 ? (
              <div
                data-ocid="dashboard.events_empty_state"
                className="text-center py-8"
              >
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-body">
                  No events yet
                </p>
              </div>
            ) : (
              <Table data-ocid="dashboard.events_table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Event</TableHead>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Type</TableHead>
                    <TableHead className="font-body">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((event, idx) => (
                    <TableRow
                      key={event.id}
                      data-ocid={`dashboard.events_row.${idx + 1}`}
                    >
                      <TableCell className="font-body font-medium">
                        {event.title}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {formatDate(event.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-body text-xs">
                          {event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-body text-xs ${getStatusColor(event.status)}`}
                          variant="outline"
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Volunteers Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Top Volunteers by Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVols ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !volunteers || volunteers.length === 0 ? (
              <div
                data-ocid="dashboard.volunteers_empty_state"
                className="text-center py-8"
              >
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-body">
                  No volunteers registered
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...volunteers]
                  .sort((a, b) => Number(b.totalHours) - Number(a.totalHours))
                  .slice(0, 5)
                  .map((vol, idx) => (
                    <div
                      key={vol.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                        style={{
                          background: "oklch(0.92 0.03 145)",
                          color: "oklch(0.28 0.09 152)",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium truncate">
                          {vol.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {vol.department}
                        </p>
                      </div>
                      <span
                        className="text-sm font-body font-semibold flex-shrink-0"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      >
                        {Number(vol.totalHours)} hrs
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Re-export hooks for this component
export {
  useGetAllVolunteers,
  useGetAllEvents,
  useGetAllAttendanceCount,
  useSeedSampleData,
} from "./dashboardHelpers";
