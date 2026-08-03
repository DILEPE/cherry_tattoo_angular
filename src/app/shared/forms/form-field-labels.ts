/** Etiquetas legibles para mensajes de validación (clave = nombre del control). */
export const CUSTOMER_FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellidos',
  birthDate: 'Fecha de nacimiento',
  documentType: 'Tipo de documento',
  documentNumber: 'Número de documento',
  documentIssueDate: 'Expedición del documento',
  email: 'Correo electrónico',
  phoneNumber: 'Teléfono',
  address: 'Dirección',
  nationality: 'Nacionalidad',
  profession: 'Profesión',
  socialMedia: 'Redes / contacto social',
  emergencyContactName: 'Contacto emergencia (nombre)',
  emergencyContactPhone: 'Contacto emergencia (teléfono)',
  guardianName: 'Nombre del tutor',
  guardianDocumentType: 'Tipo de documento del tutor',
  guardianDocumentNumber: 'Número de documento del tutor',
  guardianDocumentIssueDate: 'Expedición del documento del tutor',
};

export const BOOKING_FIELD_LABELS: Record<string, string> = {
  docNumber: 'Número de documento',
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Celular',
  email: 'Correo electrónico',
  workKind: 'Tipo de trabajo',
  staffId: 'Profesional',
  slot: 'Hora de inicio',
  endSlot: 'Hora de fin',
  design: 'Descripción del diseño',
  observations: 'Notas u observaciones',
  total: 'Valor total',
  deposit: 'Abono inicial',
};

export const LOGIN_FIELD_LABELS: Record<string, string> = {
  username: 'Usuario',
  password: 'Contraseña',
};

export const RESCHEDULE_FIELD_LABELS: Record<string, string> = {
  date: 'Nueva fecha',
  slot: 'Hora de inicio',
  endSlot: 'Hora de fin',
};

export const FINANCIALS_FIELD_LABELS: Record<string, string> = {
  total: 'Valor total del trabajo',
  extra: 'Abono adicional',
  note: 'Nota del abono',
};
