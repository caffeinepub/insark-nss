import {
  Award,
  BarChart2,
  Bell,
  Calendar,
  CheckSquare,
  Image,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { AuthSession } from "../../App";
import AppSidebar from "../../components/AppSidebar";
import ChatPage from "../ChatPage";
import CoordAttendance from "./pages/Attendance";
import CoordCertificates from "./pages/Certificates";
import CoordDashboardHome from "./pages/DashboardHome";
import CoordEvents from "./pages/Events";
import CoordFeedback from "./pages/Feedback";
import CoordGallery from "./pages/Gallery";
import CoordNotifications from "./pages/Notifications";
import CoordReports from "./pages/Reports";
import CoordVolunteers from "./pages/Volunteers";

interface Props {
  session: AuthSession;
  onLogout: () => void;
}

type CoordPage =
  | "dashboard"
  | "events"
  | "volunteers"
  | "attendance"
  | "reports"
  | "gallery"
  | "certificates"
  | "feedback"
  | "notifications"
  | "chat";

export default function CoordinatorDashboard({ session, onLogout }: Props) {
  const [activePage, setActivePage] = useState<CoordPage>("dashboard");

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      ocid: "nav.coordinator.dashboard_link",
    },
    {
      key: "events",
      label: "Events",
      icon: Calendar,
      ocid: "nav.coordinator.events_link",
    },
    {
      key: "volunteers",
      label: "Volunteers",
      icon: Users,
      ocid: "nav.coordinator.volunteers_link",
    },
    {
      key: "attendance",
      label: "Attendance",
      icon: CheckSquare,
      ocid: "nav.coordinator.attendance_link",
    },
    {
      key: "reports",
      label: "Reports",
      icon: BarChart2,
      ocid: "nav.coordinator.reports_link",
    },
    {
      key: "gallery",
      label: "Gallery",
      icon: Image,
      ocid: "nav.coordinator.gallery_link",
    },
    {
      key: "certificates",
      label: "Certificates",
      icon: Award,
      ocid: "nav.coordinator.certificates_link",
    },
    {
      key: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      ocid: "nav.coordinator.feedback_link",
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      ocid: "nav.coordinator.notifications_link",
    },
    {
      key: "chat",
      label: "Chat",
      icon: MessagesSquare,
      ocid: "nav.coordinator.chat_link",
    },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <CoordDashboardHome session={session} />;
      case "events":
        return <CoordEvents session={session} />;
      case "volunteers":
        return <CoordVolunteers />;
      case "attendance":
        return <CoordAttendance />;
      case "reports":
        return <CoordReports />;
      case "gallery":
        return <CoordGallery session={session} />;
      case "certificates":
        return <CoordCertificates />;
      case "feedback":
        return <CoordFeedback />;
      case "notifications":
        return <CoordNotifications session={session} />;
      case "chat":
        return <ChatPage session={session} />;
      default:
        return <CoordDashboardHome session={session} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        session={session}
        navItems={navItems}
        activePage={activePage}
        onNavigate={(p) => setActivePage(p as CoordPage)}
        onLogout={onLogout}
        title="INSARK"
        subtitle="Coordinator Portal"
      />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
}
