export type Lang = 'en' | 'gr'

export const translations = {
  en: {
    // Navigation
    nav_my_schedule: 'My Schedule',
    nav_dashboard: 'Dashboard',
    nav_sign_out: 'Sign Out',
    nav_sign_in: 'Sign In',

    // Home page
    home_eyebrow: 'Schedule',
    home_heading: 'Upcoming',
    home_heading_em: 'classes',
    home_subtext: 'Reserve your spot — classes fill quickly.',
    home_empty_title: 'All clear for now',
    home_empty_sub: 'No upcoming classes scheduled yet.',
    home_credits_label: 'credits',

    // Class row
    class_with: 'with',
    class_spot_left: 'spot left',
    class_spots_left: 'spots left',
    class_full: 'Full',
    class_on_waitlist: 'on waitlist',
    class_online: 'Online',
    class_studio: 'Studio',

    // BookButton
    book_book: 'Book',
    book_join_waitlist: 'Join Waitlist',
    book_booked: 'Booked',
    book_on_waitlist: 'Waitlist',
    book_booking: 'Booking…',

    // CancelButton
    cancel_cancel: 'Cancel',
    cancel_leave: 'Leave list',
    cancel_confirm_booking: 'Cancel booking?',
    cancel_confirm_waitlist: 'Leave waitlist?',
    cancel_yes: 'Yes',
    cancel_no: 'No',

    // My bookings page
    my_eyebrow: 'My Account',
    my_heading: 'My',
    my_heading_em: 'schedule',
    my_heading_em_named: 'schedule',
    my_credits_label: 'credits remaining',
    my_credit_label: 'credit remaining',
    my_upcoming: 'Upcoming Bookings',
    my_waitlist_section: 'On the Waitlist',
    my_past: 'Past Sessions',
    my_no_upcoming: 'No upcoming bookings.',
    my_no_upcoming_sub: 'Head to the schedule to reserve a class.',
    my_today: 'Today',
    my_attended: 'Attended',
    my_missed: 'Missed',
    my_position: 'Position',

    // Login page
    login_sign_in_heading: 'Sign',
    login_create_heading: 'Create',
    login_sign_in_em: 'in',
    login_create_em: 'account',
    login_subtext_in: 'Welcome back.',
    login_subtext_up: 'Join the studio.',
    login_email: 'Email',
    login_password: 'Password',
    login_name: 'Full Name',
    login_submit_in: 'Sign In',
    login_submit_up: 'Create Account',
    login_switch_to_signup: "Don't have an account? Sign up",
    login_switch_to_signin: 'Already have an account? Sign in',

    // Admin dashboard
    admin_eyebrow: 'Admin',
    admin_heading: 'Studio',
    admin_heading_em: 'dashboard',
    admin_upcoming_classes: 'Upcoming classes',
    admin_active_bookings: 'Active bookings',
    admin_total_clients: 'Total clients',
    admin_credits_held: 'Credits held',
    admin_quick_actions: 'Quick Actions',
    admin_add_class: 'Add Class',
    admin_attendance: 'Attendance',
    admin_manage_credits: 'Credits',
    admin_add_client: 'Add Client',
    admin_classes_section: 'Classes',
    admin_clients_section: 'Clients',
    admin_view: 'View',
    admin_booked: 'booked',
    admin_waitlisted: 'waitlisted',
    admin_no_classes: 'No upcoming classes.',
    admin_no_clients: 'No clients yet.',
    admin_past_classes: 'Past Classes',
    admin_past_classes_note: 'Classes from the last 30 days.',

    // Admin credits page
    credits_heading: 'Credit',
    credits_heading_em: 'management',
    credits_subtext: 'Assign class packs to clients.',
    credits_remaining: 'credits remaining',
    credits_no_clients: 'No clients registered yet',

    // Admin add-class page
    add_class_heading: 'Add',
    add_class_heading_em: 'classes',
    add_class_subtext: 'Schedule one session or a full recurring timetable.',
    add_class_tab_single: 'Single Class',
    add_class_tab_recurring: 'Recurring Schedule',
    add_class_type: 'Class Type',
    add_class_in_person: 'In-Person',
    add_class_online: 'Online',
    add_class_name: 'Class Name',
    add_class_name_placeholder: 'e.g. Morning Flow, Reformer Basics',
    add_class_instructor: 'Instructor Name',
    add_class_instructor_placeholder: 'e.g. Sofia Martins',
    add_class_duration: 'Duration',
    add_class_capacity: 'Capacity (spots)',
    add_class_capacity_hint_in: '4 for in-person',
    add_class_capacity_hint_online: '5 for online',
    add_class_capacity_hint: 'Default: {hint}. Adjust if needed.',
    add_class_datetime: 'Date & Start Time',
    add_class_days: 'Days of Week',
    add_class_time: 'Class Time',
    add_class_range: 'Date Range',
    add_class_from: 'From',
    add_class_to: 'To',
    add_class_preview_sessions: '{n} sessions will be created',
    add_class_preview_session: '1 session will be created',
    add_class_no_match: 'No matching dates in range. Make sure the selected days fall within your date window.',
    add_class_submit_single: 'Create Class',
    add_class_submit_multi: 'Create {n} Classes',
    add_class_creating: 'Creating…',

    // Edit class page
    edit_class_heading: 'Edit',
    edit_class_heading_em: 'Class',
    edit_class_submit: 'Save Changes',
    edit_class_saving: 'Saving…',
    edit_class_back: 'Back to Dashboard',

    // Admin calendar
    admin_edit: 'Edit',

    // Admin attendance page
    attendance_heading: 'Class',
    attendance_heading_em: 'attendance',
    attendance_subtext: 'Check clients in and out. Credits are deducted on check-in.',
    attendance_no_classes: 'No upcoming classes.',
    attendance_booked: 'booked',
    attendance_past: 'Past Classes',

    // Admin add-client page
    add_client_heading: 'Add a',
    add_client_heading_em: 'client',
    add_client_subtext: 'The client will receive an email invite to set their password.',
    add_client_name: 'Full Name',
    add_client_name_placeholder: 'e.g. Maria Papadopoulou',
    add_client_email: 'Email Address',
    add_client_email_placeholder: 'e.g. maria@example.com',
    add_client_submit: 'Send Invite',
    add_client_sending: 'Sending…',
    add_client_success: 'Invite sent to {email}. The client will appear in your list once they accept.',

    // Admin client detail page
    client_eyebrow: 'Client',
    client_member_since: 'Member since',
    client_credits_label: 'credits',
    client_total_bookings: 'Total bookings',
    client_attended: 'Classes attended',
    client_upcoming: 'Upcoming',
    client_grant_credits: 'Grant Credits',
    client_upcoming_bookings: 'Upcoming Bookings',
    client_past_bookings: 'Past Bookings',
    client_credit_history: 'Credit History',
    client_no_show: 'No-show',
    client_booked: 'Booked',
    client_cancel: 'Cancel',
    client_move: 'Move',
    client_add_to_class: 'Add to Class',
    client_select_class: 'Select a class…',
    client_confirm: 'Confirm',
    client_move_to: 'Move to:',
    client_on_waitlist: 'On Waitlist',
    client_remove: 'Remove',
    credit_type_granted: 'Granted',
    credit_type_deducted: 'Deducted',
    credit_type_refunded: 'Refunded',
    credit_col_type: 'Type',
    credit_col_amount: 'Amount',
    credit_col_note: 'Note',
    credit_col_date: 'Date',

    // CheckInToggle
    checkin_label: 'Checked in',

    // DeleteClassButton
    delete_delete: 'Delete',
    delete_sure: 'Sure?',
    delete_yes: 'Yes, delete',
    delete_cancel_x: '✕',

    // Common
    common_back_dashboard: '← Back to Dashboard',
    common_loading: 'Loading…',
  },

  gr: {
    // Navigation
    nav_my_schedule: 'Πρόγραμμά μου',
    nav_dashboard: 'Πίνακας',
    nav_sign_out: 'Αποσύνδεση',
    nav_sign_in: 'Σύνδεση',

    // Home page
    home_eyebrow: 'Πρόγραμμα',
    home_heading: 'Επερχόμενα',
    home_heading_em: 'μαθήματα',
    home_subtext: 'Κλείστε τη θέση σας — οι θέσεις γεμίζουν γρήγορα.',
    home_empty_title: 'Δεν υπάρχουν μαθήματα',
    home_empty_sub: 'Δεν έχουν προγραμματιστεί μαθήματα ακόμα.',
    home_credits_label: 'credits',

    // Class row
    class_with: 'με',
    class_spot_left: 'θέση',
    class_spots_left: 'θέσεις',
    class_full: 'Πλήρες',
    class_on_waitlist: 'σε λίστα',
    class_online: 'Online',
    class_studio: 'Studio',

    // BookButton
    book_book: 'Κράτηση',
    book_join_waitlist: 'Λίστα αναμονής',
    book_booked: 'Κρατημένο',
    book_on_waitlist: 'Λίστα',
    book_booking: 'Κράτηση…',

    // CancelButton
    cancel_cancel: 'Ακύρωση',
    cancel_leave: 'Αφαίρεση',
    cancel_confirm_booking: 'Ακύρωση κράτησης;',
    cancel_confirm_waitlist: 'Αφαίρεση από λίστα;',
    cancel_yes: 'Ναι',
    cancel_no: 'Όχι',

    // My bookings page
    my_eyebrow: 'Ο Λογαριασμός μου',
    my_heading: 'Το πρόγραμμά',
    my_heading_em: 'μου',
    my_heading_em_named: 'πρόγραμμα',
    my_credits_label: 'credits',
    my_credit_label: 'credit',
    my_upcoming: 'Επερχόμενες Κρατήσεις',
    my_waitlist_section: 'Λίστα Αναμονής',
    my_past: 'Προηγούμενα Μαθήματα',
    my_no_upcoming: 'Δεν υπάρχουν επερχόμενες κρατήσεις.',
    my_no_upcoming_sub: 'Πηγαίνετε στο πρόγραμμα για να κλείσετε μάθημα.',
    my_today: 'Σήμερα',
    my_attended: 'Παρών',
    my_missed: 'Απών',
    my_position: 'Θέση',

    // Login page
    login_sign_in_heading: 'Σύνδεση',
    login_create_heading: 'Δημιουργία λογαριασμού',
    login_sign_in_em: 'στον λογαριασμό',
    login_create_em: 'λογαριασμού',
    login_subtext_in: 'Καλώς ήρθατε.',
    login_subtext_up: 'Εγγραφή στο studio.',
    login_email: 'Email',
    login_password: 'Κωδικός',
    login_name: 'Ονοματεπώνυμο',
    login_submit_in: 'Σύνδεση',
    login_submit_up: 'Δημιουργία',
    login_switch_to_signup: 'Δεν έχετε λογαριασμό; Εγγραφή',
    login_switch_to_signin: 'Έχετε λογαριασμό; Σύνδεση',

    // Admin dashboard
    admin_eyebrow: 'Admin',
    admin_heading: 'Πίνακας',
    admin_heading_em: 'ελέγχου',
    admin_upcoming_classes: 'Επερχόμενα μαθήματα',
    admin_active_bookings: 'Ενεργές κρατήσεις',
    admin_total_clients: 'Σύνολο πελατών',
    admin_credits_held: 'Credits σε χρήση',
    admin_quick_actions: 'Γρήγορες Ενέργειες',
    admin_add_class: 'Νέο Μάθημα',
    admin_attendance: 'Παρουσίες',
    admin_manage_credits: 'Credits',
    admin_add_client: 'Νέος Πελάτης',
    admin_classes_section: 'Μαθήματα',
    admin_clients_section: 'Πελάτες',
    admin_view: 'Προβολή',
    admin_booked: 'κρατημένα',
    admin_waitlisted: 'σε λίστα',
    admin_no_classes: 'Δεν υπάρχουν μαθήματα.',
    admin_no_clients: 'Δεν υπάρχουν πελάτες ακόμα.',
    admin_past_classes: 'Παρελθόν',
    admin_past_classes_note: 'Μαθήματα των τελευταίων 30 ημερών.',

    // Admin credits page
    credits_heading: 'Διαχείριση',
    credits_heading_em: 'credits',
    credits_subtext: 'Χορήγηση πακέτων σε πελάτες.',
    credits_remaining: 'credits',
    credits_no_clients: 'Δεν υπάρχουν πελάτες ακόμα',

    // Admin add-class page
    add_class_heading: 'Προσθήκη',
    add_class_heading_em: 'μαθημάτων',
    add_class_subtext: 'Ορίστε ένα μάθημα ή ολόκληρο εβδομαδιαίο πρόγραμμα.',
    add_class_tab_single: 'Μεμονωμένο',
    add_class_tab_recurring: 'Επαναλαμβανόμενο',
    add_class_type: 'Τύπος Μαθήματος',
    add_class_in_person: 'Δια ζώσης',
    add_class_online: 'Online',
    add_class_name: 'Όνομα Μαθήματος',
    add_class_name_placeholder: 'π.χ. Morning Flow, Reformer Basics',
    add_class_instructor: 'Εκπαιδευτής',
    add_class_instructor_placeholder: 'π.χ. Σοφία Μαρτίνς',
    add_class_duration: 'Διάρκεια',
    add_class_capacity: 'Χωρητικότητα',
    add_class_capacity_hint_in: '4 για δια ζώσης',
    add_class_capacity_hint_online: '5 για online',
    add_class_capacity_hint: 'Προεπιλογή: {hint}. Τροποποιήστε αν χρειάζεται.',
    add_class_datetime: 'Ημερομηνία & Ώρα',
    add_class_days: 'Ημέρες Εβδομάδας',
    add_class_time: 'Ώρα Μαθήματος',
    add_class_range: 'Εύρος Ημερομηνιών',
    add_class_from: 'Από',
    add_class_to: 'Έως',
    add_class_preview_sessions: '{n} μαθήματα θα δημιουργηθούν',
    add_class_preview_session: '1 μάθημα θα δημιουργηθεί',
    add_class_no_match: 'Δεν βρέθηκαν ημερομηνίες. Ελέγξτε ότι οι ημέρες βρίσκονται εντός του εύρους.',
    add_class_submit_single: 'Δημιουργία Μαθήματος',
    add_class_submit_multi: 'Δημιουργία {n} Μαθημάτων',
    add_class_creating: 'Δημιουργία…',

    // Edit class page
    edit_class_heading: 'Επεξεργασία',
    edit_class_heading_em: 'Μαθήματος',
    edit_class_submit: 'Αποθήκευση',
    edit_class_saving: 'Αποθήκευση…',
    edit_class_back: 'Πίσω στον Πίνακα',

    // Admin calendar
    admin_edit: 'Επεξεργασία',

    // Admin attendance page
    attendance_heading: 'Παρουσίες',
    attendance_heading_em: 'μαθημάτων',
    attendance_subtext: 'Καταχωρήστε παρουσίες. Τα credits αφαιρούνται κατά το check-in.',
    attendance_no_classes: 'Δεν υπάρχουν μαθήματα.',
    attendance_booked: 'κρατημένα',
    attendance_past: 'Παρελθόν',

    // Admin add-client page
    add_client_heading: 'Προσθήκη',
    add_client_heading_em: 'πελάτη',
    add_client_subtext: 'Ο πελάτης θα λάβει email πρόσκληση για να ορίσει τον κωδικό του.',
    add_client_name: 'Ονοματεπώνυμο',
    add_client_name_placeholder: 'π.χ. Μαρία Παπαδοπούλου',
    add_client_email: 'Διεύθυνση Email',
    add_client_email_placeholder: 'π.χ. maria@example.com',
    add_client_submit: 'Αποστολή Πρόσκλησης',
    add_client_sending: 'Αποστολή…',
    add_client_success: 'Η πρόσκληση εστάλη στο {email}. Ο πελάτης θα εμφανιστεί στη λίστα μόλις αποδεχτεί.',

    // Admin client detail page
    client_eyebrow: 'Πελάτης',
    client_member_since: 'Μέλος από',
    client_credits_label: 'credits',
    client_total_bookings: 'Συνολικές κρατήσεις',
    client_attended: 'Παρακολουθήσεις',
    client_upcoming: 'Επερχόμενα',
    client_grant_credits: 'Χορήγηση Credits',
    client_upcoming_bookings: 'Επερχόμενες Κρατήσεις',
    client_past_bookings: 'Παρελθόντα Μαθήματα',
    client_credit_history: 'Ιστορικό Credits',
    client_no_show: 'Απουσία',
    client_booked: 'Κρατημένο',
    client_cancel: 'Ακύρωση',
    client_move: 'Μεταφορά',
    client_add_to_class: 'Προσθήκη σε μάθημα',
    client_select_class: 'Επιλογή μαθήματος…',
    client_confirm: 'Επιβεβαίωση',
    client_move_to: 'Μεταφορά σε:',
    client_on_waitlist: 'Σε λίστα',
    client_remove: 'Αφαίρεση',
    credit_type_granted: 'Χορήγηση',
    credit_type_deducted: 'Αφαίρεση',
    credit_type_refunded: 'Επιστροφή',
    credit_col_type: 'Τύπος',
    credit_col_amount: 'Ποσό',
    credit_col_note: 'Σημείωση',
    credit_col_date: 'Ημερομηνία',

    // CheckInToggle
    checkin_label: 'Παρών',

    // DeleteClassButton
    delete_delete: 'Διαγραφή',
    delete_sure: 'Σίγουρα;',
    delete_yes: 'Ναι',
    delete_cancel_x: '✕',

    // Common
    common_back_dashboard: '← Πίσω στο Dashboard',
    common_loading: 'Φόρτωση…',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function translate(
  lang: Lang,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const dict = translations[lang] as Record<string, string>
  let str = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    })
  }
  return str
}
