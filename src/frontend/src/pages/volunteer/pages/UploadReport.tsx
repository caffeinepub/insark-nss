import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AuthSession } from "../../../App";
import { useGetMyFeedback, useSubmitFeedback } from "../../../hooks/useQueries";
import { formatDate } from "../../../lib/helpers";

const REPORT_PREFIX = "[REPORT]";

interface Props {
  session: AuthSession;
}

export default function VolunteerUploadReport({ session: _session }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: myFeedback, isLoading } = useGetMyFeedback();
  const submitFeedback = useSubmitFeedback();

  // Filter only reports (messages starting with [REPORT])
  const myReports = (myFeedback ?? []).filter((f) =>
    f.message.startsWith(REPORT_PREFIX),
  );

  const parseReport = (message: string) => {
    const body = message.slice(REPORT_PREFIX.length).trim();
    const titleMatch = body.match(/^Title: (.+)\n/);
    const contentMatch = body.match(/\nContent: ([\s\S]*)$/);
    return {
      title: titleMatch ? titleMatch[1] : "Untitled Report",
      content: contentMatch ? contentMatch[1] : body,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const message = `${REPORT_PREFIX} Title: ${title.trim()}\nContent: ${content.trim()}`;
    await submitFeedback.mutateAsync({ eventId: null, message });
    setTitle("");
    setContent("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Upload Report</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Submit your activity reports to coordinators
        </p>
      </motion.div>

      {/* Submit form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Upload className="w-4 h-4" />
              New Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="report-title" className="font-body text-sm">
                  Report Title
                </Label>
                <Input
                  id="report-title"
                  data-ocid="upload_report.title_input"
                  placeholder="e.g. Community Drive Summary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-body"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-content" className="font-body text-sm">
                  Report Details
                </Label>
                <Textarea
                  id="report-content"
                  data-ocid="upload_report.content_textarea"
                  placeholder="Describe the activity, outcome, and any observations..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="font-body resize-none"
                  required
                />
              </div>
              <Button
                data-ocid="upload_report.submit_button"
                type="submit"
                disabled={
                  submitFeedback.isPending || !title.trim() || !content.trim()
                }
                className="w-full font-body"
                style={{ background: "oklch(0.32 0.09 152)", color: "white" }}
              >
                {submitFeedback.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Report Submitted!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Submit Report
                  </>
                )}
              </Button>
              {submitFeedback.isError && (
                <p
                  data-ocid="upload_report.error_state"
                  className="text-sm text-destructive font-body text-center"
                >
                  Failed to submit report. Please try again.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Past reports */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              My Submitted Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : myReports.length === 0 ? (
              <div
                data-ocid="upload_report.empty_state"
                className="text-center py-10"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body">
                  No reports submitted yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports
                  .slice()
                  .sort((a, b) => Number(b.submittedAt) - Number(a.submittedAt))
                  .map((report, idx) => {
                    const parsed = parseReport(report.message);
                    return (
                      <div
                        key={report.id}
                        data-ocid={`upload_report.item.${idx + 1}`}
                        className="p-4 rounded-xl border"
                        style={{ background: "oklch(0.98 0.005 140)" }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-body font-semibold text-sm">
                            {parsed.title}
                          </p>
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
                            {report.coordinatorResponse
                              ? "Reviewed"
                              : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {formatDate(report.submittedAt)}
                        </p>
                        <p className="text-sm font-body text-muted-foreground mt-2 line-clamp-2">
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
                            <span className="font-semibold">Coordinator: </span>
                            {report.coordinatorResponse}
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
    </div>
  );
}
