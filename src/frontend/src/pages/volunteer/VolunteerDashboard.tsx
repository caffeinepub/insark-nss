import {
  Award,
  Bell,
  Calendar,
  CheckSquare,
  Clock,
  Image,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { useState } from "react";
import type { AuthSession } from "../../App";
import AppSidebar from "../../components/AppSidebar";
import { useGetUnreadNotificationCount } from "../../hooks/useQueries";
import ChatPage from "../ChatPage";
import VolunteerAttendance from "./pages/Attendance";
import VolunteerCertificates from "./pages/Certificates";
import VolunteerDashboardHome from "./pages/DashboardHome";
import VolunteerEvents from "./pages/Events";
import VolunteerFeedback from "./pages/Feedback";
import VolunteerGallery from "./pages/Gallery";
import VolunteerNotifications from "./pages/Notifications";
import VolunteerServiceHours from "./pages/ServiceHours";

interface Props {
  session: AuthSession;
  onLogout: () => void;
}

type VolunteerPage =
  | "dashboard"
  | "events"
  | "attendance"
  | "service-hours"
  | "gallery"
  | "certificates"
  | "feedback"
  | "notifications"
  | "chat";

export default function VolunteerDashboard({ session, onLogout }: Props) {
  const [activePage, setActivePage] = useState<VolunteerPage>("dashboard");
  const { data: unreadCount } = useGetUnreadNotificationCount();

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      ocid: "nav.volunteer.dashboard_link",
    },
    {
      key: "events",
      label: "Events",
      icon: Calendar,
      ocid: "nav.volunteer.events_link",
    },
    {
      key: "attendance",
      label: "My Attendance",
      icon: CheckSquare,
      ocid: "nav.volunteer.attendance_link",
    },
    {
      key: "service-hours",
      label: "Service Hours",
      icon: Clock,
      ocid: "nav.volunteer.hours_link",
    },
    {
      key: "gallery",
      label: "Photo Gallery",
      icon: Image,
      ocid: "nav.volunteer.gallery_link",
    },
    {
      key: "certificates",
      label: "Certificates",
      icon: Award,
      ocid: "nav.volunteer.certificates_link",
    },
    {
      key: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      ocid: "nav.volunteer.feedback_link",
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount ? Number(unreadCount) : undefined,
      ocid: "nav.volunteer.notifications_link",
    },
    {
      key: "chat",
      label: "Chat",
      icon: MessagesSquare,
      ocid: "nav.volunteer.chat_link",
    },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <VolunteerDashboardHome
            session={session}
            onNavigate={(p) => setActivePage(p as VolunteerPage)}
          />
        );
      case "events":
        return <VolunteerEvents />;
      case "attendance":
        return <VolunteerAttendance session={session} />;
      case "service-hours":
        return <VolunteerServiceHours session={session} />;
      case "gallery":
        return <VolunteerGallery />;
      case "certificates":
        return <VolunteerCertificates session={session} />;
      case "feedback":
        return <VolunteerFeedback />;
      case "notifications":
        return <VolunteerNotifications />;
      case "chat":
        return <ChatPage session={session} />;
      default:
        return (
          <VolunteerDashboardHome
            session={session}
            onNavigate={(p) => setActivePage(p as VolunteerPage)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        session={session}
        navItems={navItems}
        activePage={activePage}
        onNavigate={(p) => setActivePage(p as VolunteerPage)}
        onLogout={onLogout}
        title="INSARK"
        subtitle="Volunteer Portal"
      />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
}
