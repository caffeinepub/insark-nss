import type { Attendance } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddServiceHours,
  useGetAllEvents,
  useGetAllServiceHoursForEvent,
  useGetAllVolunteers,
  useGetAttendanceForEvent,
  useManuallyMarkAttendance,
} from "../../../hooks/useQueries";

const MAX_DAYS = 6;

interface VolunteerRow {
  id: string;
  name: string;
  department: string;
  rollNumber: string;
  days: boolean[];
  activityPoint: string;
}

function buildSet(att: Attendance[] | undefined): Set<string> {
  return new Set((att ?? []).map((a) => a.volunteerId));
}

export default function CoordAttendance() {
  const { data: events, isLoading: loadingEvents } = useGetAllEvents();
  const { data: volunteers, isLoading: loadingVolunteers } =
    useGetAllVolunteers();

  const visibleEvents = useMemo(
    () => (events ?? []).slice(0, MAX_DAYS),
    [events],
  );

  const { data: att0 } = useGetAttendanceForEvent(visibleEvents[0]?.id ?? "");
  const { data: att1 } = useGetAttendanceForEvent(visibleEvents[1]?.id ?? "");
  const { data: att2 } = useGetAttendanceForEvent(visibleEvents[2]?.id ?? "");
  const { data: att3 } = useGetAttendanceForEvent(visibleEvents[3]?.id ?? "");
  const { data: att4 } = useGetAttendanceForEvent(visibleEvents[4]?.id ?? "");
  const { data: att5 } = useGetAttendanceForEvent(visibleEvents[5]?.id ?? "");
  const { data: sh0 } = useGetAllServiceHoursForEvent(
    visibleEvents[0]?.id ?? "",
  );

  const markAttendanceMutation = useManuallyMarkAttendance();
  const addServiceHours = useAddServiceHours();

  const [rows, setRows] = useState<VolunteerRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingPointIdx, setSavingPointIdx] = useState<number | null>(null);

  const originalSets = useMemo(
    () => [
      buildSet(att0),
      buildSet(att1),
      buildSet(att2),
      buildSet(att3),
      buildSet(att4),
      buildSet(att5),
    ],
    [att0, att1, att2, att3, att4, att5],
  );

  useEffect(() => {
    if (!volunteers) return;
    const s0 = buildSet(att0);
    const s1 = buildSet(att1);
    const s2 = buildSet(att2);
    const s3 = buildSet(att3);
    const s4 = buildSet(att4);
    const s5 = buildSet(att5);
    const sets = [s0, s1, s2, s3, s4, s5];
    const shMap = new Map((sh0 ?? []).map((s) => [s.volunteerId, s.hours]));
    setRows(
      volunteers.map((v) => ({
        id: v.id,
        name: v.name,
        department: v.department,
        rollNumber: v.rollNumber,
        days: Array.from({ length: MAX_DAYS }, (_, i) => sets[i].has(v.id)),
        activityPoint: String(Number(shMap.get(v.id) ?? 0)),
      })),
    );
  }, [volunteers, att0, att1, att2, att3, att4, att5, sh0]);

  const toggle = (rowIdx: number, dayIdx: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? { ...r, days: r.days.map((d, j) => (j === dayIdx ? !d : d)) }
          : r,
      ),
    );
  };

  const setPoints = (rowIdx: number, val: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, activityPoint: val } : r)),
    );
  };

  // Auto-save activity point when input loses focus
  const handlePointBlur = async (rowIdx: number) => {
    const row = rows[rowIdx];
    if (!row || !visibleEvents[0]) return;
    const points = Number.parseInt(row.activityPoint, 10);
    const safePoints = Number.isNaN(points) || points < 0 ? 0 : points;
    setSavingPointIdx(rowIdx);
    try {
      await addServiceHours.mutateAsync({
        volunteerId: row.id,
        eventId: visibleEvents[0].id,
        hours: BigInt(safePoints),
        date: BigInt(Date.now()),
      });
      toast.success(`Activity points saved for ${row.name}`);
    } catch {
      // may already exist or minor error
    }
    setSavingPointIdx(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let errors = 0;
    for (const row of rows) {
      const points = Number.parseInt(row.activityPoint, 10);
      const safePoints = Number.isNaN(points) || points < 0 ? 0 : points;
      for (let i = 0; i < visibleEvents.length; i++) {
        const ev = visibleEvents[i];
        const shouldBePresent = row.days[i];
        const wasPresent = originalSets[i].has(row.id);
        if (shouldBePresent && !wasPresent) {
          try {
            await markAttendanceMutation.mutateAsync({
              volunteerId: row.id,
              eventId: ev.id,
            });
          } catch {
            errors++;
          }
        }
      }
      if (visibleEvents[0] && safePoints > 0) {
        try {
          await addServiceHours.mutateAsync({
            volunteerId: row.id,
            eventId: visibleEvents[0].id,
            hours: BigInt(safePoints),
            date: BigInt(Date.now()),
          });
        } catch {
          // may already exist
        }
      }
    }
    setSaving(false);
    if (errors > 0) {
      toast.error(
        `Saved with ${errors} error(s). Some may already be recorded.`,
      );
    } else {
      toast.success("Attendance records saved successfully");
    }
  };

  const isLoading = loadingEvents || loadingVolunteers;

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-header"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">
            Student Monthly Attendance
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-0.5">
            Mark attendance and assign activity points for each volunteer
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Attendance &amp; Activity Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div
                data-ocid="attendance.empty_state"
                className="text-center py-8 text-muted-foreground font-body text-sm"
              >
                No volunteers registered yet
              </div>
            ) : (
              <>
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
                      {rows.map((row, rowIdx) => {
                        const total = row.days
                          .slice(0, visibleEvents.length)
                          .filter(Boolean).length;
                        const ap = Number.parseInt(row.activityPoint, 10);
                        const totalPoints = Number.isNaN(ap) ? 0 : ap * total;
                        const rowNum = rowIdx + 1;
                        return (
                          <TableRow
                            key={row.id}
                            data-ocid={`attendance.row.${rowNum}`}
                            className={
                              rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"
                            }
                          >
                            <TableCell className="font-body font-medium border-r">
                              {row.name}
                            </TableCell>
                            <TableCell className="font-body text-sm text-muted-foreground border-r">
                              {row.department}
                            </TableCell>
                            <TableCell className="font-body text-sm text-muted-foreground border-r">
                              {row.rollNumber}
                            </TableCell>
                            {Array.from({ length: MAX_DAYS }, (_, dayIdx) => (
                              <TableCell
                                key={
                                  visibleEvents[dayIdx]?.id ??
                                  `day-cell-${dayIdx}`
                                }
                                className="text-center border-r"
                              >
                                {dayIdx < visibleEvents.length ? (
                                  <Checkbox
                                    data-ocid={`attendance.checkbox.${rowNum}`}
                                    checked={row.days[dayIdx] ?? false}
                                    onCheckedChange={() =>
                                      toggle(rowIdx, dayIdx)
                                    }
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-body font-semibold border-r">
                              {total}
                            </TableCell>
                            <TableCell className="border-r">
                              <div className="flex items-center gap-1">
                                <Input
                                  data-ocid={`attendance.hours_input.${rowNum}`}
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={row.activityPoint}
                                  onChange={(e) =>
                                    setPoints(rowIdx, e.target.value)
                                  }
                                  onBlur={() => handlePointBlur(rowIdx)}
                                  className="font-body h-8 w-20 text-sm text-center"
                                />
                                {savingPointIdx === rowIdx && (
                                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-body font-bold">
                              {totalPoints}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    data-ocid="attendance.save_button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    size="lg"
                    className="font-body px-10"
                    style={{ background: "oklch(0.45 0.18 240)" }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Attendance Records
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
