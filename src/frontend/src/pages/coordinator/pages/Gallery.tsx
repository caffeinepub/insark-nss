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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Loader2, Trash2, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "../../../App";
import { ExternalBlob } from "../../../backend";
import {
  useAddPhoto,
  useDeletePhoto,
  useGetAllEvents,
  useGetAllPhotos,
} from "../../../hooks/useQueries";
import { formatDate } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

export default function CoordGallery({ session: _session }: Props) {
  const { data: photos, isLoading } = useGetAllPhotos();
  const { data: events } = useGetAllEvents();
  const addPhoto = useAddPhoto();
  const deletePhoto = useDeletePhoto();

  const [uploadEventId, setUploadEventId] = useState<string>("");
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

  const filtered =
    filterEventId === "all"
      ? (photos ?? [])
      : (photos ?? []).filter((p) => p.eventId === filterEventId);

  const handleFileUpload = async (file: File) => {
    if (!uploadEventId) {
      toast.error("Please select an event");
      return;
    }
    if (!uploadTitle.trim()) {
      toast.error("Please enter a photo title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      await addPhoto.mutateAsync({
        eventId: uploadEventId,
        title: uploadTitle.trim(),
        blobId: blob,
      });
      toast.success("Photo uploaded successfully");
      setUploadTitle("");
      setUploadEventId("");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePhoto.mutateAsync(deleteId);
      toast.success("Photo deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Gallery Management</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Upload and manage event photos
        </p>
      </motion.div>

      {/* Upload section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Upload Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-sm">Event</Label>
                <Select value={uploadEventId} onValueChange={setUploadEventId}>
                  <SelectTrigger
                    data-ocid="gallery.event_select"
                    className="mt-1 font-body"
                  >
                    <SelectValue placeholder="Select event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="font-body">
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-sm">Photo Title</Label>
                <Input
                  data-ocid="gallery.title_input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Tree plantation at park"
                  className="mt-1 font-body"
                />
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <button
                type="button"
                data-ocid="gallery.dropzone"
                className="w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                style={{ borderColor: "oklch(0.78 0.14 85 / 0.5)" }}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="space-y-3">
                    <Loader2
                      className="w-8 h-8 mx-auto animate-spin"
                      style={{ color: "oklch(0.32 0.09 152)" }}
                    />
                    <p className="text-sm font-body text-muted-foreground">
                      Uploading...
                    </p>
                    <Progress
                      value={uploadProgress}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-xs font-body text-muted-foreground">
                      {uploadProgress}%
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: "oklch(0.55 0.12 85)" }}
                    />
                    <p className="text-sm font-body font-medium">
                      Click to upload image
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      PNG, JPG, WEBP supported
                    </p>
                  </>
                )}
              </button>
              <Button
                data-ocid="gallery.upload_button"
                className="mt-2 font-body"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gallery grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display font-semibold">
            Photos ({filtered.length})
          </h2>
          <Select value={filterEventId} onValueChange={setFilterEventId}>
            <SelectTrigger className="w-48 font-body text-sm">
              <SelectValue />
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
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="gallery.empty_state"
            className="text-center py-12 border rounded-xl"
          >
            <Image className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground font-body">
              No photos uploaded yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((photo, idx) => {
              const event = eventMap.get(photo.eventId);
              const imgUrl = photo.blobId.getDirectURL();
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * idx }}
                  className="group relative rounded-xl overflow-hidden aspect-square bg-muted"
                  data-ocid={`gallery.item.${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-xs font-body font-medium truncate">
                      {photo.title}
                    </p>
                    {event && (
                      <p className="text-white/70 text-xs font-body truncate">
                        {event.title}
                      </p>
                    )}
                    <p className="text-white/50 text-xs font-body">
                      {formatDate(photo.uploadedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid={`gallery.delete_button.${idx + 1}`}
                    onClick={() => setDeleteId(photo.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="gallery.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Photo?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This will permanently delete the photo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="gallery.delete_cancel_button"
              className="font-body"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="gallery.delete_confirm_button"
              onClick={handleDelete}
              disabled={deletePhoto.isPending}
              className="font-body bg-destructive hover:bg-destructive/90"
            >
              {deletePhoto.isPending && (
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
