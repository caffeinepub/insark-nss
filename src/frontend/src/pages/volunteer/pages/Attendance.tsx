import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, CheckSquare, MapPin } from "lucide-react";
import { motion } from "motion/react";
import type { AuthSession } from "../../../App";
import { useGetAllEvents, useGetMyAttendance } from "../../../hooks/useQueries";
import { formatDateTime } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

export default function VolunteerAttendance({ session: _session }: Props) {
  const { data: attendance, isLoading } = useGetMyAttendance();
  const { data: events } = useGetAllEvents();

  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">My Attendance</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Your attendance records marked by coordinators
        </p>
      </motion.div>

      <Alert className="border-amber-200 bg-amber-50">
        <CheckSquare className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 font-body text-sm">
          Attendance is marked by coordinators only. You cannot self-check-in.
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
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !attendance || attendance.length === 0 ? (
              <div
                data-ocid="attendance.empty_state"
                className="text-center py-10"
              >
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body">
                  No attendance records yet
                </p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Your attendance will appear here once a coordinator marks you
                  present
                </p>
              </div>
            ) : (
              <Table data-ocid="attendance.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Event</TableHead>
                    <TableHead className="font-body">Location</TableHead>
                    <TableHead className="font-body">Marked At</TableHead>
                    <TableHead className="font-body">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((att, idx) => {
                    const event = eventMap.get(att.eventId);
                    return (
                      <TableRow
                        key={att.id}
                        data-ocid={`attendance.row.${idx + 1}`}
                      >
                        <TableCell className="font-body">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate max-w-48">
                              {event?.title ?? att.eventId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event?.location ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {formatDateTime(att.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="bg-green-100 text-green-700 font-body text-xs"
                            variant="outline"
                          >
                            Present
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {attendance && attendance.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="flex items-center gap-2 p-3 rounded-lg text-sm font-body"
            style={{
              background: "oklch(0.92 0.03 145)",
              color: "oklch(0.28 0.09 152)",
            }}
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>
              Total events attended: <strong>{attendance.length}</strong>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
