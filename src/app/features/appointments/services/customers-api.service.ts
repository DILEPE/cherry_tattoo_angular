import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CustomerSnapshot } from '../models/booking.model';

interface CustomersListResponse {
  items?: Record<string, unknown>[];
}

function rowsFromCustomersResponse(
  resp: CustomersListResponse | Record<string, unknown>[] | null | undefined,
): Record<string, unknown>[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  const items = resp.items;
  return Array.isArray(items) ? items : [];
}

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly api = inject(ApiService);

  findByDocument(documentNumber: string): Observable<CustomerSnapshot | null> {
    const doc = documentNumber.trim();
    return this.api
      .get<CustomersListResponse | Record<string, unknown>[]>('/api/customers', {
        limit: 1,
        offset: 0,
        document_number: doc,
      })
      .pipe(
        map((resp) => {
          const row = rowsFromCustomersResponse(resp)[0];
          if (!row) return null;
          return {
            id: Number(row['id'] ?? 0),
            firstName: String(row['first_name'] ?? ''),
            lastName: String(row['last_name'] ?? ''),
            phoneNumber: String(row['phone_number'] ?? ''),
            email: String(row['email'] ?? ''),
            documentType: String(row['document_type'] ?? 'CC'),
            documentNumber: String(row['document_number'] ?? documentNumber),
          };
        }),
      );
  }
}
