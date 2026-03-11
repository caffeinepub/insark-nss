import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Image, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useGetAllEvents, useGetAllPhotos } from "../../../hooks/useQueries";
import { formatDate } from "../../../lib/helpers";

export default function VolunteerGallery() {
  const { data: photos, isLoading } = useGetAllPhotos();
  const { data: events } = useGetAllEvents();
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

  const filtered =
    selectedEventFilter === "all"
      ? (photos ?? [])
      : (photos ?? []).filter((p) => p.eventId === selectedEventFilter);

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null));
  const next = () =>
    setLightboxIndex((i) =>
      i !== null ? Math.min(filtered.length - 1, i + 1) : null,
    );

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Photo Gallery</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Browse photos from NSS events
        </p>
      </motion.div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedEventFilter}
          onValueChange={setSelectedEventFilter}
        >
          <SelectTrigger
            data-ocid="gallery.filter_select"
            className="w-64 font-body"
          >
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-body">
              All Events
            </SelectItem>
            {events?.map((e) => (
              <SelectItem key={e.id} value={e.id} className="font-body">
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {photos && (
          <span className="text-sm text-muted-foreground font-body">
            {filtered.length} photo{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="gallery.empty_state" className="text-center py-12">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="text-muted-foreground font-body">No photos available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo, idx) => {
            const event = eventMap.get(photo.eventId);
            const imgUrl = photo.blobId.getDirectURL();
            return (
              <motion.button
                type="button"
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * idx }}
                className="group relative cursor-pointer rounded-xl overflow-hidden aspect-square bg-muted w-full"
                onClick={() => openLightbox(idx)}
                data-ocid={`gallery.item.${idx + 1}`}
              >
                <img
                  src={imgUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs font-body font-medium truncate">
                    {photo.title}
                  </p>
                  {event && (
                    <p className="text-white/70 text-xs font-body truncate">
                      {event.title}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          aria-modal="true"
          aria-label="Photo lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
          onKeyDown={(e) => e.key === "Escape" && closeLightbox()}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {lightboxIndex < filtered.length - 1 && (
            <button
              type="button"
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <div
            className="max-w-3xl max-h-[80vh] p-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <img
              src={filtered[lightboxIndex].blobId.getDirectURL()}
              alt={filtered[lightboxIndex].title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="text-center mt-3">
              <p className="text-white font-body font-medium">
                {filtered[lightboxIndex].title}
              </p>
              <p className="text-white/60 text-sm font-body">
                {eventMap.get(filtered[lightboxIndex].eventId)?.title ?? ""} ·{" "}
                {formatDate(filtered[lightboxIndex].uploadedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
