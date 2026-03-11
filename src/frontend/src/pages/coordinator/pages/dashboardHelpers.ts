// Re-export hooks needed by coordinator dashboard
export {
  useGetAllVolunteers,
  useGetAllEvents,
  useSeedSampleData,
} from "../../../hooks/useQueries";

// Stub hook for attendance count (not directly available as a single count)
export function useGetAllAttendanceCount() {
  return { data: 0, isLoading: false };
}
