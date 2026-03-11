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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Download, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetAllCertificates,
  useGetAllVolunteers,
  useIssueCertificate,
} from "../../../hooks/useQueries";
import { downloadCertificate, formatDate } from "../../../lib/helpers";

export default function CoordCertificates() {
  const { data: certificates, isLoading } = useGetAllCertificates();
  const { data: volunteers } = useGetAllVolunteers();
  const issueCertificate = useIssueCertificate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [volunteerId, setVolunteerId] = useState<string>("");
  const [hours, setHours] = useState<string>("120");
  const [downloadable, setDownloadable] = useState(true);

  const volunteerMap = new Map(volunteers?.map((v) => [v.id, v]) ?? []);

  const handleIssue = async () => {
    if (!volunteerId) {
      toast.error("Please select a volunteer");
      return;
    }
    if (!hours || Number(hours) <= 0) {
      toast.error("Please enter valid hours");
      return;
    }
    try {
      await issueCertificate.mutateAsync({
        volunteerId,
        hoursCompleted: BigInt(Number(hours)),
        downloadable,
      });
      toast.success("Certificate issued successfully");
      setDialogOpen(false);
      setVolunteerId("");
      setHours("120");
      setDownloadable(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to issue certificate";
      toast.error(msg);
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-header"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">Certificates</h1>
          <p className="text-muted-foreground font-body text-sm mt-0.5">
            Issue and manage volunteer certificates
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="certificates.issue_button"
              style={{ background: "oklch(0.32 0.09 152)" }}
              className="font-body"
            >
              <Plus className="w-4 h-4 mr-2" />
              Issue Certificate
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="certificates.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">
                Issue Certificate
              </DialogTitle>
              <DialogDescription className="font-body">
                Issue a service certificate to a volunteer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="font-body text-sm">Select Volunteer</Label>
                <Select value={volunteerId} onValueChange={setVolunteerId}>
                  <SelectTrigger
                    data-ocid="certificates.volunteer_select"
                    className="mt-1 font-body"
                  >
                    <SelectValue placeholder="Choose a volunteer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers?.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="font-body">
                        {v.name} — {v.rollNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-sm">Hours Completed</Label>
                <Input
                  data-ocid="certificates.hours_input"
                  type="number"
                  min="1"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="mt-1 font-body"
                />
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "oklch(0.97 0.008 140)" }}
              >
                <div>
                  <Label className="font-body text-sm font-medium">
                    Allow Download
                  </Label>
                  <p className="text-xs text-muted-foreground font-body">
                    Volunteer can download this certificate
                  </p>
                </div>
                <Switch
                  data-ocid="certificates.downloadable_switch"
                  checked={downloadable}
                  onCheckedChange={setDownloadable}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="certificates.cancel_button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="font-body"
              >
                Cancel
              </Button>
              <Button
                data-ocid="certificates.confirm_button"
                onClick={handleIssue}
                disabled={issueCertificate.isPending}
                style={{ background: "oklch(0.32 0.09 152)" }}
                className="font-body"
              >
                {issueCertificate.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Issue Certificate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              All Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !certificates || certificates.length === 0 ? (
              <div
                data-ocid="certificates.empty_state"
                className="text-center py-10"
              >
                <Award className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                <p className="text-muted-foreground font-body text-sm">
                  No certificates issued yet
                </p>
              </div>
            ) : (
              <Table data-ocid="certificates.table">
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.97 0.008 140)" }}>
                    <TableHead className="font-body font-semibold">
                      Volunteer
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Email
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Hours
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Issued On
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Downloadable
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert, idx) => {
                    const vol = volunteerMap.get(cert.volunteerId);
                    return (
                      <TableRow
                        key={cert.id}
                        data-ocid={`certificates.row.${idx + 1}`}
                      >
                        <TableCell className="font-body font-medium">
                          {vol?.name ?? cert.volunteerId}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {vol?.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-semibold font-body"
                            style={{ color: "oklch(0.32 0.09 152)" }}
                          >
                            {Number(cert.hoursCompleted)} hrs
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {formatDate(cert.issuedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-body text-xs ${cert.downloadable ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                          >
                            {cert.downloadable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cert.downloadable && vol && (
                            <Button
                              data-ocid={`certificates.download_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="font-body text-xs h-7"
                              onClick={() =>
                                downloadCertificate(
                                  vol.name,
                                  cert.hoursCompleted,
                                  cert.issuedAt,
                                )
                              }
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Download
                            </Button>
                          )}
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
    </div>
  );
}
