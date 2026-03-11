import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Clock, MapPin, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Event } from "../../../backend.d";
import { useGetAllEvents } from "../../../hooks/useQueries";
import { formatDate, formatTime, getStatusColor } from "../../../lib/helpers";

export default function VolunteerEvents() {
  const { data: events, isLoading } = useGetAllEvents();
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filtered =
    events?.filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.eventType.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  if (selectedEvent) {
    return (
      <div className="page-container">
        <button
          type="button"
          onClick={() => setSelectedEvent(null)}
          className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground mb-4"
        >
          ← Back to Events
        </button>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    className={`mb-2 font-body text-xs ${getStatusColor(selectedEvent.status)}`}
                    variant="outline"
                  >
                    {selectedEvent.status}
                  </Badge>
                  <CardTitle className="text-xl font-display">
                    {selectedEvent.title}
                  </CardTitle>
                </div>
                <button type="button" onClick={() => setSelectedEvent(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="flex items-center gap-2.5 p-3 rounded-lg"
                  style={{ background: "oklch(0.96 0.02 145)" }}
                >
                  <Calendar
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.32 0.09 152)" }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">
                      Date
                    </p>
                    <p className="text-sm font-body font-medium">
                      {formatDate(selectedEvent.date)}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2.5 p-3 rounded-lg"
                  style={{ background: "oklch(0.96 0.02 145)" }}
                >
                  <Clock
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.32 0.09 152)" }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">
                      Time
                    </p>
                    <p className="text-sm font-body font-medium">
                      {formatTime(selectedEvent.time)}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2.5 p-3 rounded-lg"
                  style={{ background: "oklch(0.96 0.02 145)" }}
                >
                  <MapPin
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.32 0.09 152)" }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">
                      Location
                    </p>
                    <p className="text-sm font-body font-medium">
                      {selectedEvent.location}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-display font-semibold mb-1">
                  Description
                </h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  {selectedEvent.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-1">
                    Event Type
                  </p>
                  <Badge variant="secondary" className="font-body">
                    {selectedEvent.eventType}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-1">
                    Required Hours
                  </p>
                  <p className="text-sm font-body font-semibold">
                    {Number(selectedEvent.requiredHours)} hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Events</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          View all NSS events
        </p>
      </motion.div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="events.search_input"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-body"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="events.empty_state" className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-body">No events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * idx }}
              data-ocid={`events.item.${idx + 1}`}
            >
              <Card
                className="shadow-card hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-xs font-display font-bold leading-tight"
                      style={{
                        background: "oklch(0.92 0.03 145)",
                        color: "oklch(0.28 0.09 152)",
                      }}
                    >
                      <span className="text-base">
                        {formatDate(event.date).split(" ")[0]}
                      </span>
                      <span>
                        {formatDate(event.date).split(" ")[1]?.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-display font-semibold truncate">
                          {event.title}
                        </h3>
                        <Badge
                          className={`text-xs font-body shrink-0 ${getStatusColor(event.status)}`}
                          variant="outline"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.time)}
                        </span>
                        <Badge variant="outline" className="text-xs font-body">
                          {event.eventType}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
