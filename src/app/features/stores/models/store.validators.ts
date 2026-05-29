import { Validators } from '@angular/forms';
import { trimRequiredValidator, optionalEmailValidator } from '../../../shared/forms/form-validators';

export const STORE_FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  address: 'Dirección',
  phone: 'Teléfono',
  email: 'Correo',
};

export const storeNameValidators = [trimRequiredValidator(), Validators.maxLength(200)];
export const storeAddressValidators = [Validators.maxLength(500)];
export const storePhoneValidators = [Validators.maxLength(40)];
export const storeEmailValidators = [Validators.maxLength(120), optionalEmailValidator()];
