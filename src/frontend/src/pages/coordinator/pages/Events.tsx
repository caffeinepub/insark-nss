import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "../../../App";
import type { Event } from "../../../backend.d";
import {
  useCreateEvent,
  useDeleteEvent,
  useGetAllEvents,
  useUpdateEvent,
} from "../../../hooks/useQueries";
import {
  dateInputToTimestamp,
  formatDate,
  formatTime,
  getStatusColor,
  timeInputToTimestamp,
  timestampToDateInput,
  timestampToTimeInput,
} from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

type EventForm = {
  title: string;
  eventType: string;
  requiredHours: string;
  status: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

const defaultForm: EventForm = {
  title: "",
  eventType: "Community Service",
  requiredHours: "4",
  status: "upcoming",
  date: "",
  time: "09:00",
  location: "",
  description: "",
};

const eventTypes = [
  "Community Service",
  "Blood Donation",
  "Tree Plantation",
  "Awareness Campaign",
  "Health Camp",
  "Cleanliness Drive",
  "Other",
];
const statuses = ["upcoming", "ongoing", "completed", "cancelled"];

export default function CoordEvents({ session }: Props) {
  const { data: events, isLoading } = useGetAllEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);

  const openCreate = () => {
    setEditEvent(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditEvent(event);
    setForm({
      title: event.title,
      eventType: event.eventType,
      requiredHours: String(Number(event.requiredHours)),
      status: event.status,
      date: timestampToDateInput(event.date),
      time: timestampToTimeInput(event.time),
      location: event.location,
      description: event.description,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.location.trim()) {
      toast.error("Please fill in title, date, and location");
      return;
    }
    const params = {
      title: form.title.trim(),
      eventType: form.eventType,
      requiredHours: BigInt(Number(form.requiredHours) || 4),
      createdBy: session.id,
      status: form.status,
      date: dateInputToTimestamp(form.date),
      time: timeInputToTimestamp(form.time),
      location: form.location.trim(),
      description: form.description.trim(),
    };
    try {
      if (editEvent) {
        await updateEvent.mutateAsync({ id: editEvent.id, ...params });
        toast.success("Event updated successfully");
      } else {
        await createEvent.mutateAsync(params);
        toast.success("Event created successfully");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent.mutateAsync(deleteId);
      toast.success("Event deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-header"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">Events</h1>
          <p className="text-muted-foreground font-body text-sm mt-0.5">
            Create and manage NSS events
          </p>
        </div>
        <Button
          data-ocid="events.create_button"
          onClick={openCreate}
          style={{ background: "oklch(0.32 0.09 152)" }}
          className="font-body"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div
            data-ocid="events.empty_state"
            className="text-center py-12 border rounded-xl"
          >
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground font-body">
              No events yet. Create your first event.
            </p>
            <Button
              data-ocid="events.create_first_button"
              className="mt-4 font-body"
              onClick={openCreate}
              style={{ background: "oklch(0.32 0.09 152)" }}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-card">
            <Table data-ocid="events.table">
              <TableHeader>
                <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                  <TableHead className="font-body font-semibold">
                    Title
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Time
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Type
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Location
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Hours
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, idx) => (
                  <TableRow key={event.id} data-ocid={`events.row.${idx + 1}`}>
                    <TableCell className="font-body font-medium max-w-40 truncate">
                      {event.title}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {formatTime(event.time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-body text-xs">
                        {event.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-body text-sm max-w-32 truncate">
                      {event.location}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {Number(event.requiredHours)}h
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`font-body text-xs ${getStatusColor(event.status)}`}
                        variant="outline"
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`events.edit_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(event)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`events.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(event.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="events.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription className="font-body">
              {editEvent
                ? "Update event details below"
                : "Fill in the event information below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input
                data-ocid="events.title_input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Event title"
                className="mt-1 font-body"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-sm">Event Type</Label>
                <Select
                  value={form.eventType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, eventType: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="events.type_select"
                    className="mt-1 font-body"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => (
                      <SelectItem key={t} value={t} className="font-body">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-sm">Required Hours</Label>
                <Input
                  data-ocid="events.hours_input"
                  type="number"
                  min="1"
                  max="100"
                  value={form.requiredHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiredHours: e.target.value }))
                  }
                  className="mt-1 font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-sm">Date *</Label>
                <Input
                  data-ocid="events.date_input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="mt-1 font-body"
                />
              </div>
              <div>
                <Label className="font-body text-sm">Time</Label>
                <Input
                  data-ocid="events.time_input"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="mt-1 font-body"
                />
              </div>
            </div>
            <div>
              <Label className="font-body text-sm">Location *</Label>
              <Input
                data-ocid="events.location_input"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Event location"
                className="mt-1 font-body"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger
                  data-ocid="events.status_select"
                  className="mt-1 font-body"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="font-body capitalize"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Description</Label>
              <Textarea
                data-ocid="events.description_textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe the event..."
                rows={3}
                className="mt-1 font-body resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="events.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="events.save_button"
              onClick={handleSave}
              disabled={isPending}
              style={{ background: "oklch(0.32 0.09 152)" }}
              className="font-body"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="events.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Event?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This will permanently delete the event and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="events.delete_cancel_button"
              className="font-body"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="events.delete_confirm_button"
              onClick={handleDelete}
              disabled={deleteEvent.isPending}
              className="font-body bg-destructive hover:bg-destructive/90"
            >
              {deleteEvent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
