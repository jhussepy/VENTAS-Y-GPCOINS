// Proyecto personal: la misma identidad se exige en firestore.rules.
export const OWNER_EMAIL = 'jhussepy08@gmail.com';
export const esPropietario = user => !!user?.uid && user.emailVerified === true && user.email?.toLowerCase() === OWNER_EMAIL;
export const esAdmin = esPropietario;
