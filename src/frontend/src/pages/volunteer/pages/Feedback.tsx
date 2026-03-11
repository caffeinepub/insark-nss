import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Loader2, MessageSquare, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetAllEvents,
  useGetMyFeedback,
  useSubmitFeedback,
} from "../../../hooks/useQueries";
import { formatDateTime } from "../../../lib/helpers";

export default function VolunteerFeedback() {
  const { data: feedbackList, isLoading } = useGetMyFeedback();
  const { data: events } = useGetAllEvents();
  const submitFeedback = useSubmitFeedback();

  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("none");

  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please write your feedback");
      return;
    }
    try {
      await submitFeedback.mutateAsync({
        eventId: selectedEvent === "none" ? null : selectedEvent,
        message: message.trim(),
      });
      setMessage("");
      setSelectedEvent("none");
      toast.success("Feedback submitted successfully!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Feedback</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Share your thoughts with coordinators
        </p>
      </motion.div>

      {/* Submit feedback form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Submit Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body text-sm">
                Related Event (Optional)
              </Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger
                  data-ocid="feedback.event_select"
                  className="mt-1 font-body"
                >
                  <SelectValue placeholder="Select an event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-body">
                    General Feedback
                  </SelectItem>
                  {events?.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="font-body">
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Your Feedback</Label>
              <Textarea
                data-ocid="feedback.textarea"
                placeholder="Write your feedback, suggestions, or concerns..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 font-body resize-none"
              />
            </div>
            <Button
              data-ocid="feedback.submit_button"
              onClick={handleSubmit}
              disabled={submitFeedback.isPending}
              style={{ background: "oklch(0.32 0.09 152)" }}
              className="font-body"
            >
              {submitFeedback.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feedback history */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              My Feedback History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : !feedbackList || feedbackList.length === 0 ? (
              <div
                data-ocid="feedback.empty_state"
                className="text-center py-8"
              >
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body text-sm">
                  No feedback submitted yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((fb, idx) => {
                  const event = fb.eventId ? eventMap.get(fb.eventId) : null;
                  const hasResponse = !!fb.coordinatorResponse;
                  return (
                    <motion.div
                      key={fb.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * idx }}
                      className="p-4 rounded-xl border space-y-3"
                      data-ocid={`feedback.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {event && (
                            <Badge
                              variant="secondary"
                              className="font-body text-xs mb-2"
                            >
                              {event.title}
                            </Badge>
                          )}
                          <p className="text-sm font-body text-foreground">
                            {fb.message}
                          </p>
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            {formatDateTime(fb.submittedAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-body flex-shrink-0 ${hasResponse ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          {hasResponse ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" /> Responded
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </>
                          )}
                        </Badge>
                      </div>

                      {hasResponse && (
                        <div
                          className="p-3 rounded-lg border-l-4"
                          style={{
                            background: "oklch(0.96 0.02 145)",
                            borderColor: "oklch(0.32 0.09 152)",
                          }}
                        >
                          <p
                            className="text-xs font-body font-semibold mb-1"
                            style={{ color: "oklch(0.32 0.09 152)" }}
                          >
                            Coordinator Response
                          </p>
                          <p className="text-sm font-body text-foreground">
                            {fb.coordinatorResponse}
                          </p>
                          {fb.respondedAt && (
                            <p className="text-xs text-muted-foreground font-body mt-1">
                              {formatDateTime(fb.respondedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
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
