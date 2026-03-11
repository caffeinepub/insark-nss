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
import { Clock, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { AuthSession } from "../../../App";
import {
  useGetAllEvents,
  useGetMyTotalServiceHours,
  useGetServiceHoursByVolunteer,
} from "../../../hooks/useQueries";
import { formatDate } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

export default function VolunteerServiceHours({ session }: Props) {
  const { data: serviceHours, isLoading } = useGetServiceHoursByVolunteer(
    session.id,
  );
  const { data: totalHours } = useGetMyTotalServiceHours();
  const { data: events } = useGetAllEvents();

  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);
  const total = Number(totalHours ?? BigInt(0));
  const target = 120;
  const percent = Math.min(100, Math.round((total / target) * 100));

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Service Hours</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Track your NSS service contributions
        </p>
      </motion.div>

      {/* Total hours card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          className="shadow-card overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.28 0.09 152), oklch(0.38 0.1 155))",
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body opacity-70 text-white">
                  Total Service Hours
                </p>
                <p className="text-5xl font-display font-bold text-white mt-1">
                  {total}
                  <span className="text-xl font-body font-normal opacity-70 ml-1">
                    hrs
                  </span>
                </p>
                <p className="text-xs font-body opacity-60 text-white mt-1">
                  {percent}% of {target} hours target
                </p>
              </div>
              <div className="w-20 h-20 relative flex-shrink-0">
                <svg
                  viewBox="0 0 36 36"
                  className="w-full h-full -rotate-90"
                  aria-label="Service hours progress"
                >
                  <title>Service hours progress</title>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="oklch(1 0 0 / 0.15)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="oklch(0.88 0.12 85)"
                    strokeWidth="3"
                    strokeDasharray={`${percent} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white opacity-80" />
                </div>
              </div>
            </div>
            <div
              className="mt-4 h-1.5 rounded-full overflow-hidden"
              style={{ background: "oklch(1 0 0 / 0.15)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "oklch(0.88 0.12 85)" }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hours breakdown table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Hours by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !serviceHours || serviceHours.length === 0 ? (
              <div
                data-ocid="service_hours.empty_state"
                className="text-center py-10"
              >
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body">
                  No service hours recorded yet
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Event</TableHead>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body text-right">
                      Hours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceHours.map((sh, idx) => {
                    const event = eventMap.get(sh.eventId);
                    return (
                      <TableRow
                        key={sh.id}
                        data-ocid={`service_hours.row.${idx + 1}`}
                      >
                        <TableCell className="font-body font-medium">
                          {event?.title ?? sh.eventId}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {formatDate(sh.date)}
                        </TableCell>
                        <TableCell className="font-body text-right">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: "oklch(0.92 0.03 145)",
                              color: "oklch(0.28 0.09 152)",
                            }}
                          >
                            <Clock className="w-3 h-3" />
                            {Number(sh.hours)} hrs
                          </span>
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
    </div>
  );
}
