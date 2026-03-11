import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type FeedbackId = string;
export interface Certificate {
    id: CertificateId;
    hoursCompleted: bigint;
    downloadable: boolean;
    volunteerId: VolunteerId;
    issuedAt: bigint;
}
export type PhotoId = string;
export type EventId = string;
export interface Attendance {
    id: AttendanceId;
    eventId: EventId;
    markedBy: string;
    volunteerId: VolunteerId;
    timestamp: bigint;
}
export interface Feedback {
    id: FeedbackId;
    eventId?: EventId;
    submittedAt: bigint;
    coordinatorResponse?: string;
    volunteerId: VolunteerId;
    message: string;
    respondedAt?: bigint;
}
export type VolunteerId = string;
export interface Event {
    id: EventId;
    status: string;
    title: string;
    date: bigint;
    createdBy: CoordinatorId;
    time: bigint;
    description: string;
    requiredHours: bigint;
    location: string;
    eventType: string;
}
export type CertificateId = string;
export type AttendanceId = string;
export type NotificationId = string;
export interface Notification {
    id: NotificationId;
    title: string;
    createdAt: bigint;
    createdBy: string;
    targetAll: boolean;
    message: string;
}
export type CoordinatorId = string;
export interface ChatMessage {
    id: string;
    message: string;
    timestamp: bigint;
    senderName: string;
    senderRole: string;
    senderId: string;
}
export interface Coordinator {
    id: CoordinatorId;
    name: string;
    email: string;
}
export interface Volunteer {
    id: VolunteerId;
    totalHours: bigint;
    name: string;
    joinedAt: bigint;
    email: string;
    rollNumber: string;
    phone: string;
    department: string;
}
export interface ServiceHours {
    id: ServiceHoursId;
    eventId: EventId;
    hours: bigint;
    date: bigint;
    volunteerId: VolunteerId;
}
export type ServiceHoursId = string;
export interface UserProfile {
    userId: string;
    name: string;
    role: Role;
    email: string;
}
export interface Photo {
    id: PhotoId;
    eventId: EventId;
    title: string;
    blobId: ExternalBlob;
    uploadedAt: bigint;
}
export enum Role {
    coordinator = "coordinator",
    volunteer = "volunteer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPhoto(eventId: string, title: string, blobId: ExternalBlob): Promise<Photo>;
    addServiceHours(volunteerId: string, eventId: string, hours: bigint, date: bigint): Promise<ServiceHours>;
    adminLogin(password: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeAdminPassword(oldPassword: string, newPassword: string): Promise<boolean>;
    checkIfVolunteerAttendedEvent(volunteerId: string, eventId: string): Promise<boolean>;
    createCoordinator(name: string, email: string): Promise<Coordinator>;
    createCoordinatorAsAdmin(adminPwd: string, name: string, email: string, coordPassword: string): Promise<Coordinator>;
    createEvent(title: string, eventType: string, requiredHours: bigint, createdBy: CoordinatorId, status: string, date: bigint, time: bigint, location: string, description: string): Promise<Event>;
    createNotification(title: string, message: string, targetAll: boolean): Promise<Notification>;
    deleteCoordinator(id: string): Promise<void>;
    deleteCoordinatorAsAdmin(adminPwd: string, id: string): Promise<void>;
    deleteEvent(id: string): Promise<void>;
    deletePhoto(id: string): Promise<void>;
    deleteVolunteer(id: string): Promise<void>;
    generateEventAttendanceSummary(eventId: string): Promise<bigint>;
    generateEventAttendanceSummaryAsAdmin(adminPwd: string, eventId: string): Promise<bigint>;
    generateVolunteerHoursSummary(): Promise<Array<[string, bigint]>>;
    generateVolunteerHoursSummaryAsAdmin(adminPwd: string): Promise<Array<[string, bigint]>>;
    getAllCertificates(): Promise<Array<Certificate>>;
    getAllCoordinators(): Promise<Array<Coordinator>>;
    getAllCoordinatorsAsAdmin(adminPwd: string): Promise<Array<Coordinator>>;
    getAllEvents(): Promise<Array<Event>>;
    getAllFeedback(): Promise<Array<Feedback>>;
    getAllNotifications(): Promise<Array<Notification>>;
    getAllPhotos(): Promise<Array<Photo>>;
    getAllServiceHoursForEvent(eventId: string): Promise<Array<ServiceHours>>;
    getAllVolunteers(): Promise<Array<Volunteer>>;
    getAllVolunteersAsAdmin(adminPwd: string): Promise<Array<Volunteer>>;
    getAttendanceForEvent(eventId: string): Promise<Array<Attendance>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCertificatesByVolunteer(volunteerId: string): Promise<Array<Certificate>>;
    getChatMessages(): Promise<Array<ChatMessage>>;
    getCoordinator(id: string): Promise<Coordinator>;
    getEvent(id: string): Promise<Event>;
    getLeaderboard(): Promise<Array<Volunteer>>;
    getMyAttendance(): Promise<Array<Attendance>>;
    getMyCertificates(): Promise<Array<Certificate>>;
    getMyFeedback(): Promise<Array<Feedback>>;
    getMyTotalServiceHours(): Promise<bigint>;
    getMyVolunteerProfile(): Promise<Volunteer | null>;
    getPhotosByEvent(eventId: string): Promise<Array<Photo>>;
    getServiceHoursByVolunteer(volunteerId: string): Promise<Array<ServiceHours>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUpcomingEvents(): Promise<Array<Event>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVolunteerById(id: string): Promise<Volunteer>;
    isCallerAdmin(): Promise<boolean>;
    issueCertificate(volunteerId: string, hoursCompleted: bigint, downloadable: boolean): Promise<Certificate>;
    loginCoordinator(email: string, password: string): Promise<Coordinator | null>;
    loginVolunteer(email: string, password: string): Promise<Volunteer | null>;
    manuallyMarkAttendance(volunteerId: string, eventId: string): Promise<Attendance>;
    markAttendance(eventId: string): Promise<Attendance>;
    markNotificationAsRead(notificationId: string): Promise<void>;
    registerVolunteer(name: string, email: string, rollNumber: string, department: string, phone: string, password: string): Promise<Volunteer>;
    respondToFeedback(id: string, response: string): Promise<Feedback>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMyPassword(email: string, newPassword: string): Promise<boolean>;
    seedSampleData(): Promise<void>;
    sendMessage(message: string): Promise<ChatMessage>;
    submitFeedback(eventId: EventId | null, message: string): Promise<Feedback>;
    updateEvent(id: string, title: string, eventType: string, requiredHours: bigint, createdBy: CoordinatorId, status: string, date: bigint, time: bigint, location: string, description: string): Promise<Event>;
    updateVolunteerById(id: string, name: string, phone: string, department: string, rollNumber: string): Promise<Volunteer>;
    updateVolunteerProfile(name: string, phone: string, department: string): Promise<Volunteer>;
}
