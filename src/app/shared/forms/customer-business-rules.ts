import { CUSTOMER_BIRTH_PENDING_ISO, DocumentType } from '../../features/customers/models/customer.model';

export interface CustomerFormValues {
  birthDate: string;
  documentType: DocumentType;
  documentNumber: string;
  hasDocumentIssue: boolean;
  documentIssueDate: string;
  isMinor: boolean;
  guardianDocumentType: DocumentType | null;
  socialMedia: string;
  emergencyContactPhone: string;
}

function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function isMinorByBirth(birth: Date): boolean {
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
}

function shiftYears(base: Date, years: number): Date {
  const targetYear = base.getFullYear() + years;
  try {
    return new Date(targetYear, base.getMonth(), base.getDate());
  } catch {
    return new Date(targetYear, base.getMonth(), 28);
  }
}

/** Reglas de negocio alineadas con Streamlit / API (tras validadores de campo). */
export function validateCustomerBusinessRules(v: CustomerFormValues): string | null {
  const pending = v.birthDate === CUSTOMER_BIRTH_PENDING_ISO;
  if (pending) {
    if (v.hasDocumentIssue) {
      return 'No indiques fecha de expedición mientras el nacimiento sigue pendiente.';
    }
    return null;
  }

  const birth = parseIsoDate(v.birthDate);
  if (!birth) return 'Fecha de nacimiento inválida.';

  const minor = isMinorByBirth(birth);
  if (minor !== v.isMinor) {
    return 'La marca de menor de edad no coincide con la fecha de nacimiento.';
  }

  if (v.hasDocumentIssue) {
    const issue = parseIsoDate(v.documentIssueDate);
    if (!issue) return 'Indica una fecha de expedición válida.';
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (issue > today) return 'La fecha de expedición del documento no puede ser futura.';
    if (v.documentType === 'TI') {
      if (!minor) {
        return 'Si el tipo de documento es TI, la fecha de nacimiento debe indicar menor de 18 años.';
      }
    } else if (!minor) {
      const adulthood = shiftYears(birth, 18);
      if (issue < adulthood) {
        return 'Para documentos distintos de TI, la expedición debe ser al menos 18 años después del nacimiento.';
      }
    }
  }

  if (minor && v.guardianDocumentType === 'TI') {
    return 'El documento del tutor no puede ser TI.';
  }

  const sm = (v.socialMedia ?? '').trim();
  if (sm.length > 50) return 'Redes sociales: como máximo 50 caracteres.';

  const eph = (v.emergencyContactPhone ?? '').trim();
  if (eph) {
    const digits = eph.replace(/\D/g, '');
    if (digits.length !== 10) return 'El teléfono de emergencia debe tener 10 dígitos.';
  }

  return null;
}
