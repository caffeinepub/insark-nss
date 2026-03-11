import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Volunteer } from "../../../backend.d";
import {
  useGetAllVolunteers,
  useGetAttendanceForEvent,
  useGetServiceHoursByVolunteer,
} from "../../../hooks/useQueries";
import { formatDate } from "../../../lib/helpers";

function VolunteerDetail({
  volunteer,
  onBack,
}: { volunteer: Volunteer; onBack: () => void }) {
  const { data: serviceHours, isLoading: loadingHours } =
    useGetServiceHoursByVolunteer(volunteer.id);

  return (
    <div className="page-container">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground mb-4"
      >
        ← Back to Volunteers
      </button>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold flex-shrink-0"
                style={{
                  background: "oklch(0.92 0.03 145)",
                  color: "oklch(0.28 0.09 152)",
                }}
              >
                {volunteer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl font-display">
                  {volunteer.name}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="font-body text-xs">
                    {volunteer.department}
                  </Badge>
                  <Badge variant="outline" className="font-body text-xs">
                    {volunteer.rollNumber}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-body">
                    Email
                  </p>
                  <p className="text-xs font-body font-medium truncate">
                    {volunteer.email}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-body">
                    Phone
                  </p>
                  <p className="text-xs font-body font-medium">
                    {volunteer.phone}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-body">
                    Total Hours
                  </p>
                  <p
                    className="text-sm font-display font-bold"
                    style={{ color: "oklch(0.32 0.09 152)" }}
                  >
                    {Number(volunteer.totalHours)}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-body">
                    Joined
                  </p>
                  <p className="text-xs font-body font-medium">
                    {formatDate(volunteer.joinedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-display font-semibold mb-3">
                Service Hours Breakdown
              </h3>
              {loadingHours ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : !serviceHours || serviceHours.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">
                  No service hours recorded
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-body">Event ID</TableHead>
                      <TableHead className="font-body">Date</TableHead>
                      <TableHead className="font-body text-right">
                        Hours
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceHours.map((sh, idx) => (
                      <TableRow
                        key={sh.id}
                        data-ocid={`volunteers.hours_row.${idx + 1}`}
                      >
                        <TableCell className="font-body text-xs text-muted-foreground">
                          {sh.eventId}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {formatDate(sh.date)}
                        </TableCell>
                        <TableCell className="font-body text-right font-semibold">
                          {Number(sh.hours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CoordVolunteers() {
  const { data: volunteers, isLoading } = useGetAllVolunteers();
  const [search, setSearch] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null,
  );

  if (selectedVolunteer) {
    return (
      <VolunteerDetail
        volunteer={selectedVolunteer}
        onBack={() => setSelectedVolunteer(null)}
      />
    );
  }

  const filtered =
    volunteers?.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase()) ||
        v.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.department.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Volunteers</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {volunteers?.length ?? 0} registered volunteers
        </p>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="volunteers.search_input"
          placeholder="Search volunteers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-body"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="volunteers.empty_state"
            className="text-center py-12 border rounded-xl"
          >
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground font-body">
              No volunteers found
            </p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-card">
            <Table data-ocid="volunteers.table">
              <TableHeader>
                <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                  <TableHead className="font-body font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Roll No.
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Department
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Total Hours
                  </TableHead>
                  <TableHead className="font-body font-semibold" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vol, idx) => (
                  <TableRow
                    key={vol.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelectedVolunteer(vol)}
                    data-ocid={`volunteers.row.${idx + 1}`}
                  >
                    <TableCell className="font-body">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                          style={{
                            background: "oklch(0.92 0.03 145)",
                            color: "oklch(0.28 0.09 152)",
                          }}
                        >
                          {vol.name.charAt(0)}
                        </div>
                        <span className="font-medium">{vol.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {vol.email}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {vol.rollNumber}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {vol.department}
                    </TableCell>
                    <TableCell className="font-body text-right">
                      <span
                        className="font-semibold"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      >
                        {Number(vol.totalHours)} hrs
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Export hook for use in detail
export { useGetAttendanceForEvent };
