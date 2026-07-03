// Canonical, server-side-trusted list of permissions a "admin" role user may
// hold. payments.* and users.delete are deliberately absent — never grantable
// to a plain admin, regardless of what a client payload requests.
export const ADMIN_PERMISSIONS = [
  "users.view",
  "users.edit",
  "users.suspend",
  "courses.view",
  "courses.create",
  "courses.edit",
  "courses.publish",
  "courses.delete",
  "testseries.view",
  "testseries.create",
  "testseries.edit",
  "chapters.view",
  "chapters.edit",
  "analytics.view",
  "settings.view",
  "settings.edit",
];

// Never trust a client-submitted permissions array directly — intersect it
// against the allow-list before persisting.
export const sanitizePermissions = (permissions) =>
  Array.isArray(permissions)
    ? permissions.filter((p) => ADMIN_PERMISSIONS.includes(p))
    : [];
