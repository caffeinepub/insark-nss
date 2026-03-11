// ── Date / Time Helpers ──────────────────────────────────────────────────────

export function formatDate(timestamp: bigint): string {
  if (!timestamp) return "—";
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: bigint): string {
  if (!timestamp) return "—";
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(timestamp: bigint): string {
  if (!timestamp) return "—";
  const date = new Date(Number(timestamp));
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateInputToTimestamp(dateStr: string): bigint {
  if (!dateStr) return BigInt(0);
  return BigInt(new Date(dateStr).getTime());
}

export function timestampToDateInput(timestamp: bigint): string {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp));
  return date.toISOString().split("T")[0];
}

export function timeInputToTimestamp(timeStr: string): bigint {
  if (!timeStr) return BigInt(0);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMs = (hours * 60 + minutes) * 60 * 1000;
  return BigInt(totalMs);
}

export function timestampToTimeInput(timestamp: bigint): string {
  if (!timestamp) return "";
  const totalMs = Number(timestamp);
  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ── Status Helpers ────────────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "upcoming":
      return "bg-blue-100 text-blue-700";
    case "ongoing":
      return "bg-green-100 text-green-700";
    case "completed":
      return "bg-gray-100 text-gray-600";
    case "cancelled":
      return "bg-red-100 text-red-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportCSV(
  filename: string,
  rows: string[][],
  headers: string[],
) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Certificate Download ──────────────────────────────────────────────────────

export function generateCertificateHTML(
  volunteerName: string,
  hours: bigint,
  issuedAt: bigint,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 60px; background: #f9f7f4; }
    .cert { max-width: 700px; margin: 0 auto; border: 6px double #1a3d2b; padding: 48px; background: white; }
    h1 { color: #1a3d2b; font-size: 36px; margin-bottom: 8px; }
    .subtitle { color: #b07d2c; font-size: 18px; margin-bottom: 32px; }
    .name { font-size: 28px; font-weight: bold; color: #1a3d2b; margin: 24px 0; }
    .hours { font-size: 22px; color: #444; }
    .date { margin-top: 32px; color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <div class="cert">
    <h1>INSARK</h1>
    <div class="subtitle">National Service Scheme Certificate of Service</div>
    <p>This is to certify that</p>
    <div class="name">${volunteerName}</div>
    <p>has successfully completed</p>
    <div class="hours">${Number(hours)} Service Hours</div>
    <div class="date">Issued on ${formatDate(issuedAt)}</div>
  </div>
</body>
</html>`;
}

export function downloadCertificate(
  volunteerName: string,
  hours: bigint,
  issuedAt: bigint,
) {
  const html = generateCertificateHTML(volunteerName, hours, issuedAt);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `certificate-${volunteerName.replace(/\s+/g, "-").toLowerCase()}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
