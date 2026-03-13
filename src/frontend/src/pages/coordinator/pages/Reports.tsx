import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart2,
  Download,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  useGenerateEventAttendanceSummary,
  useGenerateVolunteerHoursSummary,
  useGetAllEvents,
  useGetAllFeedback,
  useGetAllVolunteers,
  useRespondToFeedback,
} from "../../../hooks/useQueries";
import { exportCSV, formatDate } from "../../../lib/helpers";

const REPORT_PREFIX = "[REPORT]";

function parseReport(message: string) {
  const body = message.slice(REPORT_PREFIX.length).trim();
  const titleMatch = body.match(/^Title: (.+)\n/);
  const contentMatch = body.match(/\nContent: ([\s\S]*)$/);
  return {
    title: titleMatch ? titleMatch[1] : "Untitled Report",
    content: contentMatch ? contentMatch[1] : body,
  };
}

export default function CoordReports() {
  const { data: hoursSummary, isLoading: loadingHours } =
    useGenerateVolunteerHoursSummary();
  const { data: volunteers } = useGetAllVolunteers();
  const { data: events } = useGetAllEvents();
  const { data: allFeedback, isLoading: loadingReports } = useGetAllFeedback();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { data: eventAttendance, isLoading: loadingAttendance } =
    useGenerateEventAttendanceSummary(selectedEventId);
  const respondMutation = useRespondToFeedback();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const volunteerMap = new Map(volunteers?.map((v) => [v.id, v]) ?? []);

  // Filter only volunteer reports
  const volunteerReports = (allFeedback ?? [])
    .filter((f) => f.message.startsWith(REPORT_PREFIX))
    .sort((a, b) => Number(b.submittedAt) - Number(a.submittedAt));

  const handleExportHours = () => {
    if (!hoursSummary) return;
    const rows = hoursSummary.map(([id, hours]) => {
      const vol = volunteerMap.get(id);
      return [
        vol?.name ?? id,
        vol?.email ?? "",
        vol?.department ?? "",
        String(Number(hours)),
      ];
    });
    exportCSV("volunteer-hours-summary.csv", rows, [
      "Name",
      "Email",
      "Department",
      "Total Hours",
    ]);
  };

  const handleExportAttendance = () => {
    if (!events) return;
    const rows = events.map((e) => [
      e.title,
      e.eventType,
      String(Number(e.requiredHours)),
      e.status,
    ]);
    exportCSV("event-summary.csv", rows, [
      "Event Title",
      "Type",
      "Required Hours",
      "Status",
    ]);
  };

  const handleSendReply = async (reportId: string) => {
    if (!replyText.trim()) return;
    await respondMutation.mutateAsync({
      id: reportId,
      response: replyText.trim(),
    });
    setReplyingId(null);
    setReplyText("");
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Reports</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Generate and export NSS activity reports
        </p>
      </motion.div>

      {/* Volunteer Submitted Reports */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Volunteer Reports
              {volunteerReports.length > 0 && (
                <Badge className="font-body text-xs ml-1">
                  {volunteerReports.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : volunteerReports.length === 0 ? (
              <div
                data-ocid="reports.volunteer_reports_empty_state"
                className="text-center py-8"
              >
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-body">
                  No reports submitted by volunteers yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {volunteerReports.map((report, idx) => {
                  const parsed = parseReport(report.message);
                  const vol = volunteerMap.get(report.volunteerId);
                  const isReplying = replyingId === report.id;
                  return (
                    <div
                      key={report.id}
                      data-ocid={`reports.volunteer_report.${idx + 1}`}
                      className="p-4 rounded-xl border"
                      style={{ background: "oklch(0.98 0.005 140)" }}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-body font-semibold text-sm">
                            {parsed.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">
                            {vol?.name ?? report.volunteerId} &middot;{" "}
                            {formatDate(report.submittedAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="font-body text-xs shrink-0"
                          style={{
                            borderColor: report.coordinatorResponse
                              ? "oklch(0.55 0.15 150)"
                              : "oklch(0.7 0.05 200)",
                            color: report.coordinatorResponse
                              ? "oklch(0.32 0.09 152)"
                              : "oklch(0.5 0.05 200)",
                          }}
                        >
                          {report.coordinatorResponse ? "Reviewed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm font-body text-foreground mt-2">
                        {parsed.content}
                      </p>

                      {report.coordinatorResponse && (
                        <div
                          className="mt-3 p-3 rounded-lg text-sm font-body"
                          style={{
                            background: "oklch(0.94 0.02 145)",
                            color: "oklch(0.28 0.09 152)",
                          }}
                        >
                          <span className="font-semibold">Your reply: </span>
                          {report.coordinatorResponse}
                        </div>
                      )}

                      {!report.coordinatorResponse && (
                        <div className="mt-3">
                          {isReplying ? (
                            <div className="space-y-2">
                              <Textarea
                                data-ocid={`reports.report_reply_textarea.${idx + 1}`}
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                className="font-body text-sm resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  data-ocid={`reports.report_reply_submit.${idx + 1}`}
                                  size="sm"
                                  className="font-body text-xs"
                                  style={{
                                    background: "oklch(0.32 0.09 152)",
                                    color: "white",
                                  }}
                                  disabled={
                                    respondMutation.isPending ||
                                    !replyText.trim()
                                  }
                                  onClick={() => handleSendReply(report.id)}
                                >
                                  {respondMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Send Reply"
                                  )}
                                </Button>
                                <Button
                                  data-ocid={`reports.report_reply_cancel.${idx + 1}`}
                                  size="sm"
                                  variant="ghost"
                                  className="font-body text-xs"
                                  onClick={() => {
                                    setReplyingId(null);
                                    setReplyText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              data-ocid={`reports.report_reply_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="font-body text-xs"
                              onClick={() => {
                                setReplyingId(report.id);
                                setReplyText("");
                              }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1.5" />
                              Reply
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Volunteer Hours Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">
                Volunteer Hours Summary
              </CardTitle>
              <Button
                data-ocid="reports.export_button"
                variant="outline"
                size="sm"
                onClick={handleExportHours}
                disabled={!hoursSummary || hoursSummary.length === 0}
                className="font-body text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHours ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !hoursSummary || hoursSummary.length === 0 ? (
              <div
                data-ocid="reports.hours_empty_state"
                className="text-center py-8"
              >
                <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-body">
                  No data available
                </p>
              </div>
            ) : (
              <Table data-ocid="reports.hours_table">
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                    <TableHead className="font-body font-semibold">
                      Rank
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Volunteer
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Email
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Department
                    </TableHead>
                    <TableHead className="font-body font-semibold text-right">
                      Total Hours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...hoursSummary]
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([id, hours], idx) => {
                      const vol = volunteerMap.get(id);
                      return (
                        <TableRow
                          key={id}
                          data-ocid={`reports.hours_row.${idx + 1}`}
                        >
                          <TableCell className="font-body text-muted-foreground text-sm">
                            #{idx + 1}
                          </TableCell>
                          <TableCell className="font-body font-medium">
                            {vol?.name ?? id}
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">
                            {vol?.email ?? "—"}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {vol?.department ?? "—"}
                          </TableCell>
                          <TableCell className="font-body text-right">
                            <span
                              className="font-bold text-sm"
                              style={{ color: "oklch(0.32 0.09 152)" }}
                            >
                              {Number(hours)} hrs
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

      {/* Event Attendance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">
                Event Attendance Count
              </CardTitle>
              <Button
                data-ocid="reports.export_events_button"
                variant="outline"
                size="sm"
                onClick={handleExportAttendance}
                disabled={!events || events.length === 0}
                className="font-body text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger
                data-ocid="reports.event_select"
                className="w-full max-w-sm font-body"
              >
                <SelectValue placeholder="Select an event to see count..." />
              </SelectTrigger>
              <SelectContent>
                {events?.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="font-body">
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEventId && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                {loadingAttendance ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm font-body text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground font-body">
                        Total Attendees
                      </p>
                      <p
                        className="text-3xl font-display font-bold"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      >
                        {Number(eventAttendance ?? BigInt(0))}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-body ml-auto">
                      {events?.find((e) => e.id === selectedEventId)?.title}
                    </Badge>
                  </>
                )}
              </div>
            )}

            {events && events.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                    <TableHead className="font-body font-semibold">
                      Event
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Required Hours
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, idx) => (
                    <TableRow
                      key={event.id}
                      data-ocid={`reports.events_row.${idx + 1}`}
                    >
                      <TableCell className="font-body font-medium">
                        {event.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-body text-xs">
                          {event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {Number(event.requiredHours)} hrs
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-body text-xs capitalize"
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
    </div>
  );
}
