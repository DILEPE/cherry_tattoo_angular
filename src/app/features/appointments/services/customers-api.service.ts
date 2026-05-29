import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CustomerSnapshot } from '../models/booking.model';

interface CustomersListResponse {
  items?: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly api = inject(ApiService);

  findByDocument(documentNumber: string): Observable<CustomerSnapshot | null> {
    return this.api
      .get<CustomersListResponse>('/api/customers', {
        limit: 1,
        offset: 0,
        document_number: documentNumber.trim(),
      })
      .pipe(
        map((resp) => {
          const row = resp.items?.[0];
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
