import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Lock } from "lucide-react";
import { motion } from "motion/react";
import type { AuthSession } from "../../../App";
import { useGetMyCertificates } from "../../../hooks/useQueries";
import { downloadCertificate, formatDate } from "../../../lib/helpers";

interface Props {
  session: AuthSession;
}

export default function VolunteerCertificates({ session }: Props) {
  const { data: certificates, isLoading } = useGetMyCertificates();

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Certificates</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Your NSS service certificates
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <div data-ocid="certificates.empty_state" className="text-center py-12">
          <Award className="w-14 h-14 mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="text-muted-foreground font-body">
            No certificates issued yet
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Complete service hours to receive your NSS certificate
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              data-ocid={`certificates.item.${idx + 1}`}
            >
              <Card
                className="shadow-card overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.97 0.01 90), oklch(0.95 0.04 100))",
                  borderColor: "oklch(0.78 0.14 85 / 0.4)",
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "oklch(0.78 0.14 85 / 0.2)" }}
                      >
                        <Award
                          className="w-5 h-5"
                          style={{ color: "oklch(0.55 0.12 60)" }}
                        />
                      </div>
                      <CardTitle className="text-base font-display">
                        Certificate of Service
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-body text-xs ${cert.downloadable ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {cert.downloadable ? "Downloadable" : "Locked"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: "oklch(1 0 0 / 0.6)" }}
                    >
                      <p className="text-xs text-muted-foreground font-body">
                        Hours Completed
                      </p>
                      <p
                        className="text-xl font-display font-bold"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      >
                        {Number(cert.hoursCompleted)}
                        <span className="text-sm font-body font-normal text-muted-foreground ml-1">
                          hrs
                        </span>
                      </p>
                    </div>
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: "oklch(1 0 0 / 0.6)" }}
                    >
                      <p className="text-xs text-muted-foreground font-body">
                        Issued On
                      </p>
                      <p className="text-sm font-body font-medium">
                        {formatDate(cert.issuedAt)}
                      </p>
                    </div>
                  </div>

                  {cert.downloadable ? (
                    <Button
                      data-ocid={`certificates.download_button.${idx + 1}`}
                      size="sm"
                      className="w-full font-body"
                      style={{ background: "oklch(0.32 0.09 152)" }}
                      onClick={() =>
                        downloadCertificate(
                          session.name,
                          cert.hoursCompleted,
                          cert.issuedAt,
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full font-body"
                      variant="outline"
                      disabled
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Not Available for Download
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
