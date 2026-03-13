import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ExternalBlob, Role } from "../backend";
import type {
  Attendance,
  Certificate,
  ChatMessage,
  Coordinator,
  Event,
  Feedback,
  Notification,
  Photo,
  ServiceHours,
  Volunteer,
} from "../backend.d";
import { useActor } from "./useActor";

// Helper: retry an ICP read call up to `times` times with a delay between attempts
async function retryRead<T>(
  fn: () => Promise<T>,
  times = 3,
  delayMs = 1500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < times - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// ── Events ──────────────────────────────────────────────────────────────────

export function useGetAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllEvents());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    refetchInterval: 15000,
  });
}

export function useGetUpcomingEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<Event[]>({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getUpcomingEvents());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetEvent(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return retryRead(() => actor.getEvent(id));
    },
    enabled: !!actor && !isFetching && !!id,
    retry: 3,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      eventType: string;
      requiredHours: bigint;
      createdBy: string;
      status: string;
      date: bigint;
      time: bigint;
      location: string;
      description: string;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.createEvent(
        params.title,
        params.eventType,
        params.requiredHours,
        params.createdBy,
        params.status,
        params.date,
        params.time,
        params.location,
        params.description,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      eventType: string;
      requiredHours: bigint;
      createdBy: string;
      status: string;
      date: bigint;
      time: bigint;
      location: string;
      description: string;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.updateEvent(
        params.id,
        params.title,
        params.eventType,
        params.requiredHours,
        params.createdBy,
        params.status,
        params.date,
        params.time,
        params.location,
        params.description,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.deleteEvent(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

// ── Volunteers ───────────────────────────────────────────────────────────────

export function useGetAllVolunteers() {
  const { actor, isFetching } = useActor();
  return useQuery<Volunteer[]>({
    queryKey: ["volunteers"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllVolunteers());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetVolunteerById(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Volunteer>({
    queryKey: ["volunteer", id],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return retryRead(() => actor.getVolunteerById(id));
    },
    enabled: !!actor && !isFetching && !!id,
    retry: 3,
  });
}

export function useRegisterVolunteer() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      email: string;
      rollNumber: string;
      department: string;
      phone: string;
      password: string;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.registerVolunteer(
        params.name,
        params.email,
        params.rollNumber,
        params.department,
        params.phone,
        params.password,
      );
    },
  });
}

export function useLoginVolunteer() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.loginVolunteer(params.email, params.password);
    },
  });
}

export function useLoginCoordinator() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.loginCoordinator(params.email, params.password);
    },
  });
}

export function useUpdateVolunteerById() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      phone: string;
      department: string;
      rollNumber: string;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.updateVolunteerById(
        params.id,
        params.name,
        params.phone,
        params.department,
        params.rollNumber,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteers"] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      name: string;
      role: "coordinator" | "volunteer";
      email: string;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.saveCallerUserProfile({
        userId: params.userId,
        name: params.name,
        role: params.role === "coordinator" ? Role.coordinator : Role.volunteer,
        email: params.email,
      });
    },
  });
}

// ── Attendance ───────────────────────────────────────────────────────────────

// Volunteer's own attendance -- polls every 5 seconds to pick up coordinator updates quickly
export function useGetMyAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getMyAttendance());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    refetchInterval: 5000,
  });
}

export function useGetAttendanceForEvent(
  eventId: string,
  pollInterval?: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "event", eventId],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return retryRead(() => actor.getAttendanceForEvent(eventId));
    },
    enabled: !!actor && !isFetching && !!eventId,
    retry: 3,
    refetchInterval: pollInterval,
  });
}

export function useManuallyMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { volunteerId: string; eventId: string }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.manuallyMarkAttendance(params.volunteerId, params.eventId);
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({
        queryKey: ["attendance", "event", params.eventId],
      });
      // Also invalidate volunteer's own attendance view so they see update faster
      qc.invalidateQueries({ queryKey: ["attendance", "mine"] });
    },
  });
}

// ── Service Hours ────────────────────────────────────────────────────────────

// Polls every 5 seconds to pick up coordinator updates quickly
export function useGetMyTotalServiceHours() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["serviceHours", "total"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return retryRead(() => actor.getMyTotalServiceHours());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    refetchInterval: 5000,
  });
}

export function useGetServiceHoursByVolunteer(
  volunteerId: string,
  pollInterval?: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery<ServiceHours[]>({
    queryKey: ["serviceHours", "volunteer", volunteerId],
    queryFn: async () => {
      if (!actor || !volunteerId) return [];
      return retryRead(() => actor.getServiceHoursByVolunteer(volunteerId));
    },
    enabled: !!actor && !isFetching && !!volunteerId,
    retry: 3,
    refetchInterval: pollInterval,
  });
}

export function useGetAllServiceHoursForEvent(eventId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ServiceHours[]>({
    queryKey: ["serviceHours", "event", eventId],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return retryRead(() => actor.getAllServiceHoursForEvent(eventId));
    },
    enabled: !!actor && !isFetching && !!eventId,
    retry: 3,
  });
}

export function useAddServiceHours() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      volunteerId: string;
      eventId: string;
      hours: bigint;
      date: bigint;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.addServiceHours(
        params.volunteerId,
        params.eventId,
        params.hours,
        params.date,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serviceHours"] });
    },
  });
}

// ── Photos ───────────────────────────────────────────────────────────────────

export function useGetAllPhotos() {
  const { actor, isFetching } = useActor();
  return useQuery<Photo[]>({
    queryKey: ["photos"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllPhotos());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetPhotosByEvent(eventId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Photo[]>({
    queryKey: ["photos", "event", eventId],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return retryRead(() => actor.getPhotosByEvent(eventId));
    },
    enabled: !!actor && !isFetching && !!eventId,
    retry: 3,
  });
}

export function useAddPhoto() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      title: string;
      blobId: ExternalBlob;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.addPhoto(params.eventId, params.title, params.blobId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
}

export function useDeletePhoto() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.deletePhoto(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
}

// ── Certificates ─────────────────────────────────────────────────────────────

export function useGetMyCertificates() {
  const { actor, isFetching } = useActor();
  return useQuery<Certificate[]>({
    queryKey: ["certificates", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getMyCertificates());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetAllCertificates() {
  const { actor, isFetching } = useActor();
  return useQuery<Certificate[]>({
    queryKey: ["certificates"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllCertificates());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useIssueCertificate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      volunteerId: string;
      hoursCompleted: bigint;
      downloadable: boolean;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.issueCertificate(
        params.volunteerId,
        params.hoursCompleted,
        params.downloadable,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export function useGetMyFeedback() {
  const { actor, isFetching } = useActor();
  return useQuery<Feedback[]>({
    queryKey: ["feedback", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getMyFeedback());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetAllFeedback() {
  const { actor, isFetching } = useActor();
  return useQuery<Feedback[]>({
    queryKey: ["feedback"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllFeedback());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useSubmitFeedback() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: string | null; message: string }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.submitFeedback(params.eventId, params.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
}

export function useRespondToFeedback() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; response: string }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.respondToFeedback(params.id, params.response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useGetAllNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllNotifications());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return retryRead(() => actor.getUnreadNotificationCount());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useCreateNotification() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      message: string;
      targetAll: boolean;
    }) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.createNotification(
        params.title,
        params.message,
        params.targetAll,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Reports ──────────────────────────────────────────────────────────────────

export function useGenerateVolunteerHoursSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["reports", "volunteer-hours"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.generateVolunteerHoursSummary());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGenerateEventAttendanceSummary(eventId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["reports", "event-attendance", eventId],
    queryFn: async () => {
      if (!actor || !eventId) return BigInt(0);
      return retryRead(() => actor.generateEventAttendanceSummary(eventId));
    },
    enabled: !!actor && !isFetching && !!eventId,
    retry: 3,
  });
}

// ── Seed Data ────────────────────────────────────────────────────────────────

export function useSeedSampleData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.seedSampleData();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ── Coordinators ─────────────────────────────────────────────────────────────

export function useGetAllCoordinators() {
  const { actor, isFetching } = useActor();
  return useQuery<Coordinator[]>({
    queryKey: ["coordinators"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllCoordinators());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}

export function useGetAllCoordinatorsAsAdmin(adminPassword: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Coordinator[]>({
    queryKey: ["coordinators", "admin"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllCoordinatorsAsAdmin(adminPassword));
    },
    enabled: !!actor && !isFetching && !!adminPassword,
    retry: 3,
  });
}

export function useGetAllVolunteersAsAdmin(adminPassword: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Volunteer[]>({
    queryKey: ["volunteers", "admin"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getAllVolunteersAsAdmin(adminPassword));
    },
    enabled: !!actor && !isFetching && !!adminPassword,
    retry: 3,
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export function useGetChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["chat"],
    queryFn: async () => {
      if (!actor) return [];
      return retryRead(() => actor.getChatMessages());
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    retry: 3,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.sendMessage(message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat"] }),
  });
}

export function useDeleteVolunteer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor)
        throw new Error(
          "Server not ready. Please wait a moment and try again.",
        );
      return actor.deleteVolunteer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volunteers"] }),
  });
}

export function useGetMyVolunteerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<Volunteer | null>({
    queryKey: ["myVolunteerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return retryRead(() => actor.getMyVolunteerProfile());
    },
    enabled: !!actor && !isFetching,
    retry: 3,
  });
}
