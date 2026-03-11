import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, Clock, Loader2, MessageSquare, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Feedback } from "../../../backend.d";
import {
  useGetAllEvents,
  useGetAllFeedback,
  useGetAllVolunteers,
  useRespondToFeedback,
} from "../../../hooks/useQueries";
import { formatDateTime } from "../../../lib/helpers";

export default function CoordFeedback() {
  const { data: feedbackList, isLoading } = useGetAllFeedback();
  const { data: volunteers } = useGetAllVolunteers();
  const { data: events } = useGetAllEvents();
  const respondToFeedback = useRespondToFeedback();

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [response, setResponse] = useState("");

  const volunteerMap = new Map(volunteers?.map((v) => [v.id, v]) ?? []);
  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

  const handleRespond = async () => {
    if (!selectedFeedback) return;
    if (!response.trim()) {
      toast.error("Please write a response");
      return;
    }
    try {
      await respondToFeedback.mutateAsync({
        id: selectedFeedback.id,
        response: response.trim(),
      });
      toast.success("Response sent successfully");
      setSelectedFeedback(null);
      setResponse("");
    } catch {
      toast.error("Failed to send response");
    }
  };

  const openResponse = (fb: Feedback) => {
    setSelectedFeedback(fb);
    setResponse(fb.coordinatorResponse ?? "");
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Feedback</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          View and respond to volunteer feedback
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
                All Feedback
              </CardTitle>
              {feedbackList && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="font-body text-xs">
                    {feedbackList.filter((f) => !f.coordinatorResponse).length}{" "}
                    pending
                  </Badge>
                  <Badge variant="outline" className="font-body text-xs">
                    {feedbackList.filter((f) => f.coordinatorResponse).length}{" "}
                    responded
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : !feedbackList || feedbackList.length === 0 ? (
              <div
                data-ocid="feedback.empty_state"
                className="text-center py-10"
              >
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body text-sm">
                  No feedback submitted yet
                </p>
              </div>
            ) : (
              <Table data-ocid="feedback.table">
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                    <TableHead className="font-body font-semibold">
                      Volunteer
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Event
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Message
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Submitted
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackList.map((fb, idx) => {
                    const vol = volunteerMap.get(fb.volunteerId);
                    const event = fb.eventId ? eventMap.get(fb.eventId) : null;
                    const hasResponse = !!fb.coordinatorResponse;
                    return (
                      <TableRow
                        key={fb.id}
                        data-ocid={`feedback.row.${idx + 1}`}
                      >
                        <TableCell className="font-body font-medium">
                          {vol?.name ?? fb.volunteerId}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {event?.title ?? "General"}
                        </TableCell>
                        <TableCell className="font-body text-sm max-w-48 truncate">
                          {fb.message}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {formatDateTime(fb.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-body text-xs ${hasResponse ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                          >
                            {hasResponse ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                Responded
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" /> Pending
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            data-ocid={`feedback.respond_button.${idx + 1}`}
                            size="sm"
                            variant={hasResponse ? "outline" : "default"}
                            className="font-body text-xs h-7"
                            onClick={() => openResponse(fb)}
                            style={
                              hasResponse
                                ? {}
                                : { background: "oklch(0.32 0.09 152)" }
                            }
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {hasResponse ? "Edit Reply" : "Reply"}
                          </Button>
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

      {/* Reply Dialog */}
      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFeedback(null);
            setResponse("");
          }
        }}
      >
        <DialogContent data-ocid="feedback.reply_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Respond to Feedback
            </DialogTitle>
            <DialogDescription className="font-body">
              {selectedFeedback
                ? (volunteerMap.get(selectedFeedback.volunteerId)?.name ??
                  "Volunteer")
                : "Volunteer"}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4 py-2">
              <div
                className="p-3 rounded-lg font-body text-sm"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  Volunteer's message:
                </p>
                <p>{selectedFeedback.message}</p>
              </div>
              <div>
                <Label className="font-body text-sm">Your Response</Label>
                <Textarea
                  data-ocid="feedback.response_textarea"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                  className="mt-1 font-body resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="feedback.cancel_button"
              variant="outline"
              onClick={() => {
                setSelectedFeedback(null);
                setResponse("");
              }}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="feedback.submit_response_button"
              onClick={handleRespond}
              disabled={respondToFeedback.isPending}
              style={{ background: "oklch(0.32 0.09 152)" }}
              className="font-body"
            >
              {respondToFeedback.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
