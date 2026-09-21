// GET /api/v1/admin/dashboard (permission: access_admin_panel - see admin-ops.routes.js).
// One combined endpoint for the admin landing page: aggregate counters plus a handful
// of "recent" preview rows for sections that don't have their own admin feature here yet.

export interface DashboardStats {
  pendingAppointments: number;
  confirmedAppointments: number;
  unassignedAppointments: number;
  todayAppointments: number;
  newContacts: number;
  activeEmployees: number;
  totalUsers: number;
  activePackagePurchases: number;
  pendingOrders: number;
  outOfStockProducts: number;
  pendingPayoutRequests: number;
  pendingTestimonials: number;
  inactiveResources: number;
  newsletterSubscribers: number;
}

// mapAppointmentForAdminShort (see appointment.mapper.js) - also what the forthcoming
// admin Appointments list/detail feature will use.
export interface AppointmentAdminListItem {
  id: string;
  korisnik: string;
  usluga: string;
  datum: string;
  status: string;
  statusRaw: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  konacnaCena: string;
}

// mapContactsForAdminList (see contact.mapper.js).
export interface ContactAdminListItem {
  id: string;
  imePrezime: string;
  email: string;
  tema: string | null;
  status: string;
  statusRaw: 'new' | 'read' | 'replied' | 'archived';
  datum: string;
}

// mapOrdersForAdminList (see order.mapper.js).
export interface OrderAdminListItem {
  id: string;
  korisnik: string;
  brojStavki: number;
  ukupnaCena: string;
  status: string;
  statusRaw: string;
  datum: string;
}

export interface DashboardRecent {
  pendingAppointments: AppointmentAdminListItem[];
  unassignedAppointments: AppointmentAdminListItem[];
  contacts: ContactAdminListItem[];
  orders: OrderAdminListItem[];
}

export interface DashboardData {
  stats: DashboardStats;
  recent: DashboardRecent;
}
