import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { CheckSquare, RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { AuthSession } from "../../../App";
import {
  useGetAllEvents,
  useGetAttendanceForEvent,
  useGetServiceHoursByVolunteer,
  useGetVolunteerById,
} from "../../../hooks/useQueries";

interface Props {
  session: AuthSession;
}

const MAX_DAYS = 6;

export default function VolunteerAttendance({ session }: Props) {
  const {
    data: events,
    isLoading: loadingEvents,
    dataUpdatedAt,
  } = useGetAllEvents();
  const { data: volunteerProfile } = useGetVolunteerById(session.id);

  const visibleEvents = useMemo(
    () => (events ?? []).slice(0, MAX_DAYS),
    [events],
  );

  const { data: att0, isLoading: l0 } = useGetAttendanceForEvent(
    visibleEvents[0]?.id ?? "",
    15000,
  );
  const { data: att1, isLoading: l1 } = useGetAttendanceForEvent(
    visibleEvents[1]?.id ?? "",
    15000,
  );
  const { data: att2, isLoading: l2 } = useGetAttendanceForEvent(
    visibleEvents[2]?.id ?? "",
    15000,
  );
  const { data: att3, isLoading: l3 } = useGetAttendanceForEvent(
    visibleEvents[3]?.id ?? "",
    15000,
  );
  const { data: att4, isLoading: l4 } = useGetAttendanceForEvent(
    visibleEvents[4]?.id ?? "",
    15000,
  );
  const { data: att5, isLoading: l5 } = useGetAttendanceForEvent(
    visibleEvents[5]?.id ?? "",
    15000,
  );

  const { data: serviceHours, isLoading: loadingSH } =
    useGetServiceHoursByVolunteer(session.id, 15000);

  const days = useMemo(() => {
    const atts = [att0, att1, att2, att3, att4, att5];
    return atts.map((att) =>
      (att ?? []).some((a) => a.volunteerId === session.id),
    );
  }, [att0, att1, att2, att3, att4, att5, session.id]);

  const total = days.filter(Boolean).length;

  const activityPoint = useMemo(() => {
    if (!serviceHours || serviceHours.length === 0) return 0;
    return serviceHours.reduce((sum, sh) => sum + Number(sh.hours), 0);
  }, [serviceHours]);

  const totalPoints = activityPoint * total;

  const isLoading =
    loadingEvents || l0 || l1 || l2 || l3 || l4 || l5 || loadingSH;

  const lastSynced = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">My Attendance</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Your attendance records marked by coordinators
          </p>
        </div>
        {lastSynced && (
          <div
            data-ocid="attendance.success_state"
            className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mt-1"
          >
            <RefreshCw className="w-3 h-3 animate-pulse text-green-500" />
            <span>Last synced: {formatTime(lastSynced)}</span>
          </div>
        )}
      </motion.div>

      <Alert className="border-amber-200 bg-amber-50">
        <CheckSquare className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 font-body text-sm">
          Attendance is marked by coordinators only. This table auto-updates
          every 15 seconds.
        </AlertDescription>
      </Alert>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Student Monthly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table data-ocid="attendance.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        colSpan={3 + MAX_DAYS + 3}
                        className="text-center font-display font-bold text-base py-3"
                        style={{
                          background: "oklch(0.45 0.18 240)",
                          color: "white",
                        }}
                      >
                        Student Monthly Attendance
                      </TableHead>
                    </TableRow>
                    <TableRow
                      style={{
                        background: "oklch(0.45 0.18 240)",
                        color: "white",
                      }}
                    >
                      <TableHead className="font-body font-semibold text-white border-r border-blue-400">
                        Name
                      </TableHead>
                      <TableHead className="font-body font-semibold text-white border-r border-blue-400">
                        Branch
                      </TableHead>
                      <TableHead className="font-body font-semibold text-white border-r border-blue-400">
                        Roll No.
                      </TableHead>
                      {Array.from({ length: MAX_DAYS }, (_, i) => (
                        <TableHead
                          key={visibleEvents[i]?.id ?? `day-col-${i}`}
                          className="font-body font-semibold text-white text-center w-12 border-r border-blue-400"
                        >
                          {visibleEvents[i]
                            ? visibleEvents[i].title.slice(0, 6)
                            : String(i + 1)}
                        </TableHead>
                      ))}
                      <TableHead className="font-body font-semibold text-white text-center border-r border-blue-400">
                        Total
                      </TableHead>
                      <TableHead className="font-body font-semibold text-white text-center border-r border-blue-400">
                        Activity
                        <br />
                        Point
                      </TableHead>
                      <TableHead className="font-body font-semibold text-white text-center">
                        Total
                        <br />
                        Points
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow data-ocid="attendance.row.1" className="bg-white">
                      <TableCell className="font-body font-medium border-r">
                        {volunteerProfile?.name ?? session.name}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground border-r">
                        {volunteerProfile?.department ?? "—"}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground border-r">
                        {volunteerProfile?.rollNumber ?? "—"}
                      </TableCell>
                      {Array.from({ length: MAX_DAYS }, (_, dayIdx) => (
                        <TableCell
                          key={
                            visibleEvents[dayIdx]?.id ?? `day-cell-${dayIdx}`
                          }
                          className="text-center border-r"
                        >
                          {days[dayIdx] ? (
                            <CheckSquare className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-red-300 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-body font-semibold border-r">
                        {total}
                      </TableCell>
                      <TableCell className="text-center font-body border-r">
                        {activityPoint}
                      </TableCell>
                      <TableCell className="text-center font-body font-bold">
                        {totalPoints}
                      </TableCell>
                    </TableRow>
                    {total === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3 + MAX_DAYS + 3}
                          className="text-center py-6 text-muted-foreground font-body text-sm"
                          data-ocid="attendance.empty_state"
                        >
                          No attendance records yet. Your attendance will appear
                          here once a coordinator marks you present.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
