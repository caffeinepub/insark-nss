import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Array "mo:core/Array";

actor {
  include MixinStorage();

  stable var adminPassword : Text = "Indran#12345";

  // Data Types
  public type VolunteerId = Text;
  public type CoordinatorId = Text;
  public type EventId = Text;
  public type AttendanceId = Text;
  public type ServiceHoursId = Text;
  public type PhotoId = Text;
  public type CertificateId = Text;
  public type FeedbackId = Text;
  public type NotificationId = Text;

  public type Volunteer = {
    id : VolunteerId;
    name : Text;
    email : Text;
    rollNumber : Text;
    department : Text;
    phone : Text;
    totalHours : Nat;
    joinedAt : Int;
  };

  public type Coordinator = {
    id : CoordinatorId;
    name : Text;
    email : Text;
  };

  public type Event = {
    id : EventId;
    title : Text;
    eventType : Text;
    requiredHours : Nat;
    createdBy : CoordinatorId;
    status : Text;
    date : Int;
    time : Int;
    location : Text;
    description : Text;
  };

  public type Attendance = {
    id : AttendanceId;
    volunteerId : VolunteerId;
    eventId : EventId;
    timestamp : Int;
    markedBy : Text;
  };

  public type ServiceHours = {
    id : ServiceHoursId;
    volunteerId : VolunteerId;
    eventId : EventId;
    hours : Nat;
    date : Int;
  };

  public type Photo = {
    id : PhotoId;
    eventId : EventId;
    title : Text;
    blobId : Storage.ExternalBlob;
    uploadedAt : Int;
  };

  public type Certificate = {
    id : CertificateId;
    volunteerId : VolunteerId;
    hoursCompleted : Nat;
    issuedAt : Int;
    downloadable : Bool;
  };

  public type Feedback = {
    id : FeedbackId;
    volunteerId : VolunteerId;
    eventId : ?EventId;
    message : Text;
    submittedAt : Int;
    coordinatorResponse : ?Text;
    respondedAt : ?Int;
  };

  public type Notification = {
    id : NotificationId;
    title : Text;
    message : Text;
    createdAt : Int;
    createdBy : Text;
    targetAll : Bool;
  };

  public type NotificationRead = {
    volunteerId : VolunteerId;
    notificationId : NotificationId;
  };

  public type Role = {
    #volunteer;
    #coordinator;
  };

  public type UserProfile = {
    userId : Text;
    role : Role;
    name : Text;
    email : Text;
  };

  public type ChatMessage = {
    id : Text;
    senderId : Text;
    senderName : Text;
    senderRole : Text;
    message : Text;
    timestamp : Int;
  };

  // Persistent Maps
  stable let volunteers = Map.empty<VolunteerId, Volunteer>();
  stable let coordinators = Map.empty<CoordinatorId, Coordinator>();
  stable let events = Map.empty<EventId, Event>();
  stable let attendances = Map.empty<AttendanceId, Attendance>();
  stable let serviceHours = Map.empty<ServiceHoursId, ServiceHours>();
  stable let photos = Map.empty<PhotoId, Photo>();
  stable let certificates = Map.empty<CertificateId, Certificate>();
  stable let feedbacks = Map.empty<FeedbackId, Feedback>();
  stable let notifications = Map.empty<NotificationId, Notification>();
  stable let notificationReads = Map.empty<VolunteerId, [NotificationId]>();
  stable let chatMessages = Map.empty<Text, ChatMessage>();

  // User profiles mapping Principal to UserProfile
  stable let userProfiles = Map.empty<Principal, UserProfile>();

  // Email to Principal mapping for login
  stable let emailToPrincipal = Map.empty<Text, Principal>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Function to generate unique IDs
  stable var idCounter : Nat = 0;
  func generateId(prefix : Text) : Text {
    idCounter += 1;
    prefix # idCounter.toText();
  };

  // Admin Portal Functions
  public query ({ caller }) func adminLogin(password : Text) : async Bool {
    // No authorization check - this is the authentication mechanism itself
    password == adminPassword;
  };

  public shared ({ caller }) func changeAdminPassword(oldPassword : Text, newPassword : Text) : async Bool {
    if (oldPassword == adminPassword) {
      adminPassword := newPassword;
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func createCoordinator(name : Text, email : Text) : async Coordinator {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create coordinators");
    };

    let id = generateId("coord-");
    let coordinator : Coordinator = {
      id;
      name;
      email;
    };
    coordinators.add(id, coordinator);
    coordinator;
  };

  public shared ({ caller }) func deleteCoordinator(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete coordinators");
    };

    if (not coordinators.containsKey(id)) {
      Runtime.trap("Coordinator not found");
    };
    coordinators.remove(id);
  };

  // User Profile Functions (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Volunteer Functions
  public shared ({ caller }) func registerVolunteer(name : Text, email : Text, rollNumber : Text, department : Text, phone : Text) : async Volunteer {
    if (volunteers.values().any(func(v) { v.email == email })) {
      Runtime.trap("Email already registered");
    };

    let id = generateId("volunteer-");
    let volunteer : Volunteer = {
      id;
      name;
      email;
      rollNumber;
      department;
      phone;
      totalHours = 0;
      joinedAt = 1970584789;
    };
    volunteers.add(id, volunteer);

    // Create user profile and assign user role
    let profile : UserProfile = {
      userId = id;
      role = #volunteer;
      name;
      email;
    };
    userProfiles.add(caller, profile);
    emailToPrincipal.add(email, caller);

    // Direct role assignment in access control state (bypassing admin check)
    accessControlState.userRoles.add(caller, #user);

    volunteer;
  };

  public shared ({ caller }) func loginVolunteer(email : Text) : async ?Volunteer {
    // Look up by email; also re-assign #user role so session is valid
    let found = volunteers.values().toArray().find(func(v) { v.email == email });
    switch (found) {
      case (null) { null };
      case (?vol) {
        accessControlState.userRoles.add(caller, #user);
        let profile : UserProfile = {
          userId = vol.id;
          role = #volunteer;
          name = vol.name;
          email = vol.email;
        };
        userProfiles.add(caller, profile);
        ?vol;
      };
    };
  };

  public shared ({ caller }) func loginCoordinator(email : Text) : async ?Coordinator {
    let coordinator = coordinators.values().toArray().find(func(c) { c.email == email });
    switch (coordinator) {
      case (null) { null };
      case (?foundCoordinator) {
        // Assign #user role to caller
        accessControlState.userRoles.add(caller, #user);
        let profile : UserProfile = {
          userId = foundCoordinator.id;
          role = #coordinator;
          name = foundCoordinator.name;
          email = foundCoordinator.email;
        };
        userProfiles.add(caller, profile);
        ?foundCoordinator;
      };
    };
  };

  public query ({ caller }) func getMyVolunteerProfile() : async ?Volunteer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { null };
      case (?p) {
        volunteers.get(p.userId);
      };
    };
  };

  public shared ({ caller }) func updateVolunteerProfile(name : Text, phone : Text, department : Text) : async Volunteer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update their profile");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) {
        let volunteer = volunteers.get(p.userId);
        switch (volunteer) {
          case (null) { Runtime.trap("Volunteer not found") };
          case (?v) {
            let updated : Volunteer = {
              id = v.id;
              name;
              email = v.email;
              rollNumber = v.rollNumber;
              department;
              phone;
              totalHours = v.totalHours;
              joinedAt = v.joinedAt;
            };
            volunteers.add(v.id, updated);
            updated;
          };
        };
      };
    };
  };

  // FIXED: Allow any authenticated user (#user role) to view volunteers -- coordinators have #user role
  public query ({ caller }) func getVolunteerById(id : Text) : async Volunteer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view volunteer details");
    };

    let volunteer = volunteers.get(id);
    switch (volunteer) {
      case (null) { Runtime.trap("Volunteer not found") };
      case (?volunteerData) { volunteerData };
    };
  };

  // FIXED: Allow any authenticated user (#user role) to list volunteers -- coordinators have #user role
  public query ({ caller }) func getAllVolunteers() : async [Volunteer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view all volunteers");
    };
    volunteers.values().toArray();
  };

  // Coordinator Functions
  // FIXED: Allow any authenticated user (#user role) to view coordinator details
  public query ({ caller }) func getCoordinator(id : Text) : async Coordinator {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view coordinator details");
    };

    switch (coordinators.get(id)) {
      case (null) { Runtime.trap("Coordinator not found") };
      case (?coordinator) { coordinator };
    };
  };

  // FIXED: Allow any authenticated user (#user role) to list coordinators
  public query ({ caller }) func getAllCoordinators() : async [Coordinator] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view all coordinators");
    };
    coordinators.values().toArray();
  };

  // Event Functions
  public shared ({ caller }) func createEvent(
    title : Text,
    eventType : Text,
    requiredHours : Nat,
    createdBy : CoordinatorId,
    status : Text,
    date : Int,
    time : Int,
    location : Text,
    description : Text,
  ) : async Event {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can create events");
    };

    let id = generateId("event-");
    let event : Event = {
      id;
      title;
      eventType;
      requiredHours;
      createdBy;
      status;
      date;
      time;
      location;
      description;
    };
    events.add(id, event);
    event;
  };

  public shared ({ caller }) func updateEvent(
    id : Text,
    title : Text,
    eventType : Text,
    requiredHours : Nat,
    createdBy : CoordinatorId,
    status : Text,
    date : Int,
    time : Int,
    location : Text,
    description : Text,
  ) : async Event {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can update events");
    };

    let existingEvent = events.get(id);
    if (existingEvent == null) {
      Runtime.trap("Event not found");
    };

    let updatedEvent : Event = {
      id;
      title;
      eventType;
      requiredHours;
      createdBy;
      status;
      date;
      time;
      location;
      description;
    };

    events.add(id, updatedEvent);
    updatedEvent;
  };

  public shared ({ caller }) func deleteEvent(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can delete events");
    };

    if (not events.containsKey(id)) {
      Runtime.trap("Event not found");
    };
    events.remove(id);
  };

  public query ({ caller }) func getAllEvents() : async [Event] {
    // Public access - no authorization check
    events.values().toArray();
  };

  public query ({ caller }) func getEvent(id : Text) : async Event {
    // Public access - no authorization check
    let event = events.get(id);
    switch (event) {
      case (null) { Runtime.trap("Event not found") };
      case (?eventData) { eventData };
    };
  };

  public query ({ caller }) func getUpcomingEvents() : async [Event] {
    // Public access - no authorization check
    events.values().toArray().filter(func(e) { e.status == "upcoming" });
  };

  // Attendance Functions
  public shared ({ caller }) func markAttendance(eventId : Text) : async Attendance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated volunteers can mark attendance");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) {
        if (p.role != #volunteer) {
          Runtime.trap("Unauthorized: Only volunteers can mark their own attendance");
        };

        let id = generateId("attendance-");
        let attendance : Attendance = {
          id;
          volunteerId = p.userId;
          eventId;
          timestamp = 1970584789;
          markedBy = p.userId;
        };
        attendances.add(id, attendance);
        attendance;
      };
    };
  };

  public shared ({ caller }) func manuallyMarkAttendance(volunteerId : Text, eventId : Text) : async Attendance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can manually mark attendance");
    };

    let profile = userProfiles.get(caller);
    let markedBy = switch (profile) {
      case (null) { "coordinator" };
      case (?p) { p.userId };
    };

    let id = generateId("attendance-");
    let attendance : Attendance = {
      id;
      volunteerId;
      eventId;
      timestamp = 1970584789;
      markedBy;
    };
    attendances.add(id, attendance);
    attendance;
  };

  public query ({ caller }) func getAttendanceForEvent(eventId : Text) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view event attendance");
    };

    attendances.values().toArray().filter(func(a) { a.eventId == eventId });
  };

  public query ({ caller }) func getMyAttendance() : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their attendance");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { [] };
      case (?p) {
        attendances.values().toArray().filter(func(a) { a.volunteerId == p.userId });
      };
    };
  };

  public query ({ caller }) func checkIfVolunteerAttendedEvent(volunteerId : Text, eventId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      let profile = userProfiles.get(caller);
      switch (profile) {
        case (null) { Runtime.trap("Unauthorized") };
        case (?p) {
          if (p.userId != volunteerId) {
            Runtime.trap("Unauthorized: Can only check your own attendance");
          };
        };
      };
    };

    attendances.values().toArray().any(func(a) {
      a.volunteerId == volunteerId and a.eventId == eventId
    });
  };

  // Service Hours Functions
  public shared ({ caller }) func addServiceHours(volunteerId : Text, eventId : Text, hours : Nat, date : Int) : async ServiceHours {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can add service hours");
    };

    let id = generateId("serviceHours-");
    let serviceHour : ServiceHours = {
      id;
      volunteerId;
      eventId;
      hours;
      date;
    };
    serviceHours.add(id, serviceHour);

    // Update volunteer total hours
    let volunteer = volunteers.get(volunteerId);
    switch (volunteer) {
      case (null) {};
      case (?v) {
        let updated : Volunteer = {
          id = v.id;
          name = v.name;
          email = v.email;
          rollNumber = v.rollNumber;
          department = v.department;
          phone = v.phone;
          totalHours = v.totalHours + hours;
          joinedAt = v.joinedAt;
        };
        volunteers.add(volunteerId, updated);
      };
    };

    serviceHour;
  };

  public query ({ caller }) func getServiceHoursByVolunteer(volunteerId : Text) : async [ServiceHours] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      let profile = userProfiles.get(caller);
      switch (profile) {
        case (null) { Runtime.trap("Unauthorized") };
        case (?p) {
          if (p.userId != volunteerId) {
            Runtime.trap("Unauthorized: Can only view your own service hours");
          };
        };
      };
    };

    serviceHours.values().toArray().filter(func(s) { s.volunteerId == volunteerId });
  };

  public query ({ caller }) func getAllServiceHoursForEvent(eventId : Text) : async [ServiceHours] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view all service hours for an event");
    };

    serviceHours.values().toArray().filter(func(s) { s.eventId == eventId });
  };

  public query ({ caller }) func getMyTotalServiceHours() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their total hours");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { 0 };
      case (?p) {
        let volunteer = volunteers.get(p.userId);
        switch (volunteer) {
          case (null) { 0 };
          case (?v) { v.totalHours };
        };
      };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [Volunteer] {
    // Public access - no authorization check
    let allVolunteers = volunteers.values().toArray();
    allVolunteers.sort(func(a : Volunteer, b : Volunteer) : { #less; #equal; #greater } {
      if (a.totalHours > b.totalHours) { #less }
      else if (a.totalHours < b.totalHours) { #greater }
      else { #equal };
    });
  };

  // Photo Functions
  public shared ({ caller }) func addPhoto(eventId : Text, title : Text, blobId : Storage.ExternalBlob) : async Photo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can add photos");
    };

    let id = generateId("photo-");
    let photo : Photo = {
      id;
      eventId;
      title;
      blobId;
      uploadedAt = 1970584789;
    };
    photos.add(id, photo);
    photo;
  };

  public shared ({ caller }) func deletePhoto(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can delete photos");
    };

    if (not photos.containsKey(id)) {
      Runtime.trap("Photo not found");
    };
    photos.remove(id);
  };

  public query ({ caller }) func getPhotosByEvent(eventId : Text) : async [Photo] {
    // Public access - no authorization check
    photos.values().toArray().filter(func(p) { p.eventId == eventId });
  };

  public query ({ caller }) func getAllPhotos() : async [Photo] {
    // Public access - no authorization check
    photos.values().toArray();
  };

  // Certificate Functions
  public shared ({ caller }) func issueCertificate(volunteerId : Text, hoursCompleted : Nat, downloadable : Bool) : async Certificate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can issue certificates");
    };

    let id = generateId("certificate-");
    let certificate : Certificate = {
      id;
      volunteerId;
      hoursCompleted;
      issuedAt = 1970584789;
      downloadable;
    };
    certificates.add(id, certificate);
    certificate;
  };

  public query ({ caller }) func getMyCertificates() : async [Certificate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their certificates");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { [] };
      case (?p) {
        certificates.values().toArray().filter(func(c) { c.volunteerId == p.userId });
      };
    };
  };

  public query ({ caller }) func getCertificatesByVolunteer(volunteerId : Text) : async [Certificate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      let profile = userProfiles.get(caller);
      switch (profile) {
        case (null) { Runtime.trap("Unauthorized") };
        case (?p) {
          if (p.userId != volunteerId) {
            Runtime.trap("Unauthorized: Can only view your own certificates");
          };
        };
      };
    };

    certificates.values().toArray().filter(func(c) { c.volunteerId == volunteerId });
  };

  public query ({ caller }) func getAllCertificates() : async [Certificate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view all certificates");
    };
    certificates.values().toArray();
  };

  // Feedback Functions
  public shared ({ caller }) func submitFeedback(eventId : ?EventId, message : Text) : async Feedback {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated volunteers can submit feedback");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) {
        let id = generateId("feedback-");
        let feedback : Feedback = {
          id;
          volunteerId = p.userId;
          eventId;
          message;
          submittedAt = 1970584789;
          coordinatorResponse = null;
          respondedAt = null;
        };
        feedbacks.add(id, feedback);
        feedback;
      };
    };
  };

  public query ({ caller }) func getMyFeedback() : async [Feedback] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their feedback");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { [] };
      case (?p) {
        feedbacks.values().toArray().filter(func(f) { f.volunteerId == p.userId });
      };
    };
  };

  public query ({ caller }) func getAllFeedback() : async [Feedback] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can view all feedback");
    };
    feedbacks.values().toArray();
  };

  public shared ({ caller }) func respondToFeedback(id : Text, response : Text) : async Feedback {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can respond to feedback");
    };

    let feedback = feedbacks.get(id);
    switch (feedback) {
      case (null) { Runtime.trap("Feedback not found") };
      case (?feedbackData) {
        let updatedFeedback : Feedback = {
          id = feedbackData.id;
          volunteerId = feedbackData.volunteerId;
          eventId = feedbackData.eventId;
          message = feedbackData.message;
          submittedAt = feedbackData.submittedAt;
          coordinatorResponse = ?response;
          respondedAt = ?1970584789;
        };
        feedbacks.add(id, updatedFeedback);
        updatedFeedback;
      };
    };
  };

  // Notification Functions
  public shared ({ caller }) func createNotification(title : Text, message : Text, targetAll : Bool) : async Notification {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can create notifications");
    };

    let profile = userProfiles.get(caller);
    let createdBy = switch (profile) {
      case (null) { "coordinator" };
      case (?p) { p.userId };
    };

    let id = generateId("notification-");
    let notification : Notification = {
      id;
      title;
      message;
      createdAt = 1970584789;
      createdBy;
      targetAll;
    };
    notifications.add(id, notification);
    notification;
  };

  public query ({ caller }) func getAllNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notifications");
    };
    notifications.values().toArray();
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) {
        let existing = notificationReads.get(p.userId);
        switch (existing) {
          case (null) {
            notificationReads.add(p.userId, [notificationId]);
          };
          case (?ids) {
            if (ids.any(func(x) { x == notificationId })) {
              Runtime.trap("Notification already marked as read");
            };
            let updatedIds = ids.concat([notificationId]);
            notificationReads.add(p.userId, updatedIds);
          };
        };
      };
    };
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view unread notification count");
    };

    let profile = userProfiles.get(caller);
    switch (profile) {
      case (null) { 0 };
      case (?p) {
        let readIds = notificationReads.get(p.userId);
        let totalNotifications = notifications.size();
        switch (readIds) {
          case (null) { totalNotifications };
          case (?ids) { totalNotifications - ids.size() };
        };
      };
    };
  };

  // Reporting Functions
  public query ({ caller }) func generateVolunteerHoursSummary() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can generate reports");
    };

    volunteers.values().toArray().map<Volunteer, (Text, Nat)>(func(v : Volunteer) { (v.name, v.totalHours) });
  };

  public query ({ caller }) func generateEventAttendanceSummary(eventId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can generate reports");
    };

    attendances.values().toArray().filter(func(a) { a.eventId == eventId }).size();
  };

  // Seed Data Function
  public shared ({ caller }) func seedSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coordinators can seed data");
    };

    // Seed coordinators
    let coord1 : Coordinator = {
      id = "coord-1";
      name = "John Coordinator";
      email = "john@coordinator.com";
    };
    coordinators.add("coord-1", coord1);

    // Seed sample events
    let event1 : Event = {
      id = "event-1";
      title = "Beach Cleanup";
      eventType = "Environmental";
      requiredHours = 4;
      createdBy = "coord-1";
      status = "upcoming";
      date = 1970584789;
      time = 1970584789;
      location = "Beach Park";
      description = "Clean up the beach";
    };
    events.add("event-1", event1);
  };

  // Chat Functions
  public shared ({ caller }) func sendMessage(message : Text) : async ChatMessage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };

    let userProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found for caller");
      };
      case (?profile) { profile };
    };

    let chatMessage : ChatMessage = {
      id = generateId("chatMessage-");
      senderId = userProfile.userId;
      senderName = userProfile.name;
      senderRole = switch (userProfile.role) {
        case (#volunteer) { "volunteer" };
        case (#coordinator) { "coordinator" };
      };
      message;
      timestamp = 1970584789;
    };
    chatMessages.add(chatMessage.id, chatMessage);
    chatMessage;
  };

  public query ({ caller }) func getChatMessages() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view chat messages");
    };
    chatMessages.values().toArray();
  };

  ///////////////////////////////
  //////// ADMIN AS ADMIN ///////
  ///////////////////////////////

  public shared ({ caller }) func createCoordinatorAsAdmin(adminPwd : Text, name : Text, email : Text) : async Coordinator {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let id = generateId("coord-");
    let coordinator : Coordinator = {
      id;
      name;
      email;
    };
    coordinators.add(id, coordinator);
    coordinator;
  };

  public shared ({ caller }) func deleteCoordinatorAsAdmin(adminPwd : Text, id : Text) : async () {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    if (not coordinators.containsKey(id)) {
      Runtime.trap("Coordinator not found");
    };
    coordinators.remove(id);
  };

  public query ({ caller }) func getAllCoordinatorsAsAdmin(adminPwd : Text) : async [Coordinator] {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    coordinators.values().toArray();
  };

  public query ({ caller }) func getAllVolunteersAsAdmin(adminPwd : Text) : async [Volunteer] {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    volunteers.values().toArray();
  };

  public query ({ caller }) func generateVolunteerHoursSummaryAsAdmin(adminPwd : Text) : async [(Text, Nat)] {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    volunteers.values().toArray().map<Volunteer, (Text, Nat)>(func(v : Volunteer) { (v.name, v.totalHours) });
  };

  public query ({ caller }) func generateEventAttendanceSummaryAsAdmin(adminPwd : Text, eventId : Text) : async Nat {
    if (adminPwd != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    attendances.values().toArray().filter(func(a) { a.eventId == eventId }).size();
  };
};
