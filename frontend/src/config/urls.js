// src/config/urls.ts

export const URLS = {
  // Auth
  login: '/login',
  //   register: '/register',
  forgetPassword: '/forget-password',
  logout: '/logout',
  profileSetting: '/profile-setting',
  chat: '/chat',

  // Legal
  gdpr: '/gdpr',
  terms: '/terms',

  // Dashboards
  master: {
    overview: '/admin-dashboard',
    clients: '/admin-dashboard/clients',
    clientDetails: '/admin-dashboard/clients/:id',
    services: '/admin-dashboard/services',
    serviceDetails: '/admin-dashboard/services/:id',
    addService: '/admin-dashboard/add-service',
    editService: '/admin-dashboard/edit-service/:id',
    ebooks: '/admin-dashboard/ebooks',
    series: '/admin-dashboard/series',
    addEbook: '/admin-dashboard/add-ebook',
    editEbook: '/admin-dashboard/edit-ebook/:id',
    blogs: '/admin-dashboard/blogs',
    addBlog: '/admin-dashboard/blogs/add-blog',
    editBlog: '/admin-dashboard/blogs/edit-blog/:id',
    newsletters: '/admin-dashboard/newsletters',
    addNewsletter: '/admin-dashboard/newsletters/add-newsletter',
    editNewsletter: '/admin-dashboard/newsletters/edit-newsletter/:id',
    referrals: '/admin-dashboard/referrals',
  },

  sales: {
    overview: '/sales-dashboard',
    newClients: '/sales-dashboard/new-clients',
    existingClients: '/sales-dashboard/existing-clients',
    clientDetails: '/sales-dashboard/clients/:id',
    potentialLeads: '/sales-dashboard/potential-leads',
    calendar: '/sales-dashboard/calendar',
  },

  coaching: {
    overview: '/coaching-dashboard',
    clients: '/coaching-dashboard/clients',
    calendar: '/coaching-dashboard/calendar',
    meeting: '/coaching-dashboard/meeting',
    clientDetails: '/coaching-dashboard/clients/:id',
  },

  client: {
    dashboard: '/client-dashboard',
    programs: '/client-dashboard/services',
    programDetails: '/client-dashboard/service/:id',
    meeting: '/client-dashboard/meeting',
    services: '/client-dashboard/services',
    calendar: '/client-dashboard/calendar',
    products: '/client-dashboard/products',
    chat: '/chat',
  },
}
