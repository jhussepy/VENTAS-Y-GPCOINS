// Correos con rol de administrador (panel de supervisor: ven datos de todos)
export const ADMIN_EMAILS = ['jhussepy08@gmail.com'];

export const esAdmin = (user) =>
  !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
