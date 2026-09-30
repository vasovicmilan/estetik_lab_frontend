import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { permissionGuard } from './core/guards/permission-guard';
import { employeeGuard } from './core/guards/employee-guard';
import { partnerGuard } from './core/guards/partner-guard';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { moduleGuard } from './core/guards/module-guard';
import { pageSeoResolver } from './core/resolvers/page-seo-resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    resolve: { seo: pageSeoResolver('home') },
  },
  {
    path: 'prijava',
    loadComponent: () => import('./features/auth/components/login/login').then((m) => m.Login),
  },
  {
    path: 'registracija',
    loadComponent: () => import('./features/auth/components/register/register').then((m) => m.Register),
  },
  /**
   * The four routes below are never linked from site navigation - each is the
   * frontend landing spot for a link the backend puts in a transactional email
   * (link.builder.js's LINK_ROUTES, "frontend" column). All four fire their
   * one-shot API call on load with no form beyond set-password's - see each
   * component's own header comment.
   */
  {
    path: 'verifikacija/:token',
    loadComponent: () => import('./features/auth/components/verify-account/verify-account').then((m) => m.VerifyAccount),
  },
  {
    path: 'resetovanje-lozinke/:token',
    data: { variant: 'reset' },
    loadComponent: () => import('./features/auth/components/set-password/set-password').then((m) => m.SetPassword),
  },
  {
    path: 'preuzmi-nalog/:token',
    data: { variant: 'claim' },
    loadComponent: () => import('./features/auth/components/set-password/set-password').then((m) => m.SetPassword),
  },
  {
    path: 'newsletter/odjava/:token',
    loadComponent: () =>
      import('./features/newsletter/components/newsletter-unsubscribe/newsletter-unsubscribe').then((m) => m.NewsletterUnsubscribe),
  },
  {
    path: 'usluge',
    canMatch: [moduleGuard('booking')],
    loadChildren: () => import('./features/services-catalog/services-catalog.routes').then((m) => m.SERVICES_CATALOG_ROUTES),
  },
  {
    path: 'paketi',
    canMatch: [moduleGuard('booking')],
    loadChildren: () => import('./features/packages-catalog/packages-catalog.routes').then((m) => m.PACKAGES_CATALOG_ROUTES),
  },
  // Public URL matches the backend's canonical/sitemap/llms.txt (/nas-tim). The old
  // /tim (and /tim/:slug) links keep working via the redirects below.
  {
    path: 'nas-tim',
    loadChildren: () => import('./features/team/team.routes').then((m) => m.TEAM_ROUTES),
  },
  { path: 'tim', pathMatch: 'full', redirectTo: 'nas-tim' },
  { path: 'tim/:slug', redirectTo: 'nas-tim/:slug' },
  {
    path: 'blog',
    canMatch: [moduleGuard('blog')],
    loadChildren: () => import('./features/blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  {
    path: 'saradnici',
    loadChildren: () => import('./features/business-partners/business-partners.routes').then((m) => m.BUSINESS_PARTNERS_ROUTES),
  },
  {
    path: 'kontakt',
    loadComponent: () => import('./features/contacts/components/contact-page/contact-page').then((m) => m.ContactPage),
    resolve: { seo: pageSeoResolver('contact') },
  },
  /**
   * Static/legal marketing pages - DB-backed content (see
   * core/services/site-content.ts), previously only rendered by the old EJS
   * site (see the frontend backlog's "static/legal pages" item, now closed).
   */
  {
    path: 'o-nama',
    loadComponent: () => import('./features/legal/components/about-page/about-page').then((m) => m.AboutPage),
    resolve: { seo: pageSeoResolver('about') },
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/legal/components/faq-page/faq-page').then((m) => m.FaqPage),
    resolve: { seo: pageSeoResolver('faq') },
  },
  {
    path: 'politika-privatnosti',
    loadComponent: () => import('./features/legal/components/privacy-policy-page/privacy-policy-page').then((m) => m.PrivacyPolicyPage),
    resolve: { seo: pageSeoResolver('privacyPolicy') },
  },
  {
    path: 'uslovi-koriscenja',
    loadComponent: () => import('./features/legal/components/terms-page/terms-page').then((m) => m.TermsPage),
    resolve: { seo: pageSeoResolver('termsAndConditions') },
  },
  {
    path: 'partnerski-program',
    canMatch: [moduleGuard('partners')],
    loadComponent: () => import('./features/legal/components/partnership-page/partnership-page').then((m) => m.PartnershipPage),
    resolve: { seo: pageSeoResolver('partnership') },
  },
  /**
   * Standalone public testimonial-submission form - no dedicated public
   * testimonials LIST page exists yet (see home.ts's own comment on why it was
   * left out), so this is reachable from the footer only, not from a
   * read-only display section. Any visitor may submit, no guard.
   */
  {
    path: 'utisci/ostavi',
    loadComponent: () =>
      import('./features/testimonials/components/testimonial-submit/testimonial-submit').then((m) => m.TestimonialSubmit),
  },
  {
    path: 'prodavnica',
    canMatch: [moduleGuard('shop')],
    loadChildren: () => import('./features/shop/shop.routes').then((m) => m.SHOP_ROUTES),
  },
  {
    path: 'korpa',
    canMatch: [moduleGuard('shop')],
    loadChildren: () => import('./features/shop/shop.routes').then((m) => m.CART_ROUTES),
  },
  /**
   * Customer's own "Moj nalog" area (profile, own appointments, own orders,
   * own addresses) - a sibling of the other top-level site sections, NOT
   * nested under 'admin'. Wrapped in AccountShell (its own light tab nav, see
   * that component's header comment) and gated by plain authGuard: any
   * logged-in user may reach their own account, no manage_* permission needed.
   */
  {
    path: 'moj-nalog',
    loadComponent: () => import('./features/account/components/account-shell/account-shell').then((m) => m.AccountShell),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
      },
    ],
  },
  /**
   * Employee's own "Panel zaposlenog" area (dashboard, own appointments,
   * working-hours self-edit, and - when commission-based - provisions/payouts)
   * - a sibling of the other top-level site sections, NOT nested under 'admin'.
   * Wrapped in EmployeeShell (its own light tab nav, see that component's
   * header comment) and gated by employeeGuard: any logged-in EMPLOYEE may
   * reach their own panel, no manage_* permission needed - a logged-in
   * non-employee is redirected to '/' instead.
   */
  {
    path: 'zaposleni-panel',
    canMatch: [moduleGuard('employees')],
    loadComponent: () => import('./features/employee-portal/components/employee-shell/employee-shell').then((m) => m.EmployeeShell),
    canActivate: [employeeGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/employee-portal/employee-portal.routes').then((m) => m.EMPLOYEE_PORTAL_ROUTES),
      },
    ],
  },
  /**
   * Partner's own "Panel partnera" area (dashboard, own commissions/payouts,
   * and a referral catalog with per-item links) - a sibling of the other
   * top-level site sections, NOT nested under 'admin' (admin's own management
   * of partners already exists at /admin/partneri, this is the partner's
   * self-service view of THEIR OWN data). Wrapped in PartnerShell (its own
   * light tab nav, see that component's header comment) and gated by
   * partnerGuard: any logged-in PARTNER may reach their own panel, no
   * manage_* permission needed - a logged-in non-partner is redirected to '/'
   * instead.
   */
  {
    path: 'partner-panel',
    canMatch: [moduleGuard('partners')],
    loadComponent: () => import('./features/partner-portal/components/partner-shell/partner-shell').then((m) => m.PartnerShell),
    canActivate: [partnerGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/partner-portal/partner-portal.routes').then((m) => m.PARTNER_PORTAL_ROUTES),
      },
    ],
  },
  /**
   * Single admin shell (AdminShell, layout/admin-shell/) instead of 8 unrelated
   * top-level 'admin/*' routes - gives every admin section a shared sidebar to
   * navigate between them (see AdminShell's own header comment). authGuard here
   * is only the base "must be logged in" check, same as it always was; each
   * section keeps its own permissionGuard + `data.permission` unchanged so a
   * logged-in admin without a given manage_* permission still can't reach that
   * child - nothing about the actual protection changed, only the nesting.
   *
   * permissionGuard + `data.permission: 'access_admin_panel'` is applied here
   * too, on the shell itself, so the dashboard ('') and 'profil' children -
   * which have no manage_* permission of their own - aren't reachable by just
   * any logged-in customer. Matches the backend's admin-ops router, which
   * requires this same `access_admin_panel` permission as its own base gate
   * (see admin-profile.routes.ts's and dashboard.ts's header comments).
   */
  {
    path: 'admin',
    component: AdminShell,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'access_admin_panel' },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'zakazivanja',
        canMatch: [moduleGuard('booking')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_appointments_all' },
        loadChildren: () => import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ADMIN_ROUTES),
      },
      {
        path: 'usluge',
        canMatch: [moduleGuard('booking')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_services' },
        loadChildren: () => import('./features/services-catalog/services-catalog.routes').then((m) => m.SERVICES_CATALOG_ADMIN_ROUTES),
      },
      {
        path: 'paketi',
        canMatch: [moduleGuard('booking')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_packages' },
        loadChildren: () => import('./features/packages-catalog/packages-catalog.routes').then((m) => m.PACKAGES_CATALOG_ADMIN_ROUTES),
      },
      {
        path: 'prodavnica',
        canMatch: [moduleGuard('shop')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_products' },
        loadChildren: () => import('./features/shop/shop.routes').then((m) => m.SHOP_ADMIN_ROUTES),
      },
      {
        path: 'porudzbine',
        canMatch: [moduleGuard('shop')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_orders' },
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ADMIN_ROUTES),
      },
      {
        path: 'privremene-porudzbine',
        canMatch: [moduleGuard('shop')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_orders' },
        loadChildren: () => import('./features/temporary-orders/temporary-orders.routes').then((m) => m.TEMPORARY_ORDERS_ADMIN_ROUTES),
      },
      {
        path: 'korisnici',
        canActivate: [permissionGuard],
        data: { permission: 'manage_users' },
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ADMIN_ROUTES),
      },
      {
        path: 'role',
        canActivate: [permissionGuard],
        data: { permission: 'manage_roles' },
        loadChildren: () => import('./features/roles/roles.routes').then((m) => m.ROLES_ADMIN_ROUTES),
      },
      {
        path: 'tim',
        canActivate: [permissionGuard],
        data: { permission: 'manage_employees' },
        loadChildren: () => import('./features/team/team.routes').then((m) => m.TEAM_ADMIN_ROUTES),
      },
      {
        path: 'zaposleni',
        canMatch: [moduleGuard('employees')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_employees' },
        loadChildren: () => import('./features/employees/employees.routes').then((m) => m.EMPLOYEES_ADMIN_ROUTES),
      },
      {
        path: 'blog',
        canMatch: [moduleGuard('blog')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_blog' },
        loadChildren: () => import('./features/blog/blog.routes').then((m) => m.BLOG_ADMIN_ROUTES),
      },
      {
        path: 'kategorije',
        canActivate: [permissionGuard],
        data: { permission: 'manage_taxonomy' },
        loadChildren: () => import('./features/taxonomy/taxonomy.routes').then((m) => m.CATEGORIES_ADMIN_ROUTES),
      },
      {
        path: 'tagovi',
        canActivate: [permissionGuard],
        data: { permission: 'manage_taxonomy' },
        loadChildren: () => import('./features/taxonomy/taxonomy.routes').then((m) => m.TAGS_ADMIN_ROUTES),
      },
      {
        path: 'resursi',
        canMatch: [moduleGuard('booking')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_resources' },
        loadChildren: () => import('./features/taxonomy/taxonomy.routes').then((m) => m.RESOURCES_ADMIN_ROUTES),
      },
      {
        path: 'partneri',
        canMatch: [moduleGuard('partners')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_partners' },
        loadChildren: () => import('./features/partners/partners.routes').then((m) => m.PARTNERS_ADMIN_ROUTES),
      },
      {
        path: 'poslovni-saradnici',
        canActivate: [permissionGuard],
        data: { permission: 'manage_marketing' },
        loadChildren: () => import('./features/business-partners/business-partners.routes').then((m) => m.BUSINESS_PARTNERS_ADMIN_ROUTES),
      },
      {
        path: 'kuponi',
        canMatch: [moduleGuard('coupons')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_coupons' },
        loadChildren: () => import('./features/coupons/coupons.routes').then((m) => m.COUPONS_ADMIN_ROUTES),
      },
      {
        path: 'kupljeni-paketi',
        canMatch: [moduleGuard('booking')],
        canActivate: [permissionGuard],
        data: { permission: 'manage_packages' },
        loadChildren: () => import('./features/package-purchases/package-purchases.routes').then((m) => m.PACKAGE_PURCHASES_ADMIN_ROUTES),
      },
      {
        path: 'pretplatnici',
        canActivate: [permissionGuard],
        data: { permission: 'manage_marketing' },
        loadChildren: () => import('./features/newsletter/subscribers.routes').then((m) => m.SUBSCRIBERS_ADMIN_ROUTES),
      },
      {
        path: 'kampanje',
        canActivate: [permissionGuard],
        data: { permission: 'manage_marketing' },
        loadChildren: () => import('./features/newsletter/campaigns.routes').then((m) => m.CAMPAIGNS_ADMIN_ROUTES),
      },
      {
        path: 'utisci',
        canActivate: [permissionGuard],
        data: { permission: 'manage_marketing' },
        loadChildren: () => import('./features/testimonials/testimonials.routes').then((m) => m.TESTIMONIALS_ADMIN_ROUTES),
      },
      {
        path: 'poruke',
        canActivate: [permissionGuard],
        data: { permission: 'manage_marketing' },
        loadChildren: () => import('./features/contacts/contacts.routes').then((m) => m.CONTACTS_ADMIN_ROUTES),
      },
      /**
       * Admin "Ops" module - six sections with no home elsewhere: payout
       * request management, audit log, traffic/error log digests, business
       * reports, site settings, and the admin's own profile. All new, all in
       * one shared feature folder (features/admin-ops/) split into one
       * *.routes.ts per section, same "one feature folder, multiple routes
       * files" pattern as newsletter's subscribers.routes.ts/campaigns.routes.ts.
       */
      {
        path: 'isplate',
        canActivate: [permissionGuard],
        data: { permission: 'manage_payouts' },
        loadChildren: () => import('./features/admin-ops/payouts.routes').then((m) => m.PAYOUTS_ADMIN_ROUTES),
      },
      {
        path: 'audit-log',
        canActivate: [permissionGuard],
        data: { permission: 'view_logs' },
        loadChildren: () => import('./features/admin-ops/audit-log.routes').then((m) => m.AUDIT_LOG_ADMIN_ROUTES),
      },
      {
        path: 'logovi',
        canActivate: [permissionGuard],
        data: { permission: 'view_logs' },
        loadChildren: () => import('./features/admin-ops/logs.routes').then((m) => m.LOGS_ADMIN_ROUTES),
      },
      {
        path: 'izvestaji',
        canActivate: [permissionGuard],
        data: { permission: 'view_business_reports' },
        loadChildren: () => import('./features/admin-ops/business-reports.routes').then((m) => m.BUSINESS_REPORTS_ADMIN_ROUTES),
      },
      {
        path: 'podesavanja-sajta',
        canActivate: [permissionGuard],
        data: { permission: 'manage_site_content' },
        loadChildren: () => import('./features/admin-ops/site-settings.routes').then((m) => m.SITE_SETTINGS_ADMIN_ROUTES),
      },
      {
        path: 'sadrzaj-sajta',
        canActivate: [permissionGuard],
        data: { permission: 'manage_site_content' },
        loadChildren: () => import('./features/admin-ops/site-content.routes').then((m) => m.SITE_CONTENT_ADMIN_ROUTES),
      },
      {
        path: 'profil',
        loadChildren: () => import('./features/admin-ops/admin-profile.routes').then((m) => m.ADMIN_PROFILE_ROUTES),
      },
    ],
  },
];
