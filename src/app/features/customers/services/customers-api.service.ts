import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CustomerListResult,
  CustomerSnapshot,
  CustomerWritePayload,
} from '../models/customer.model';
import {
  mapCustomer,
  mapCustomerList,
  mapCustomerSnapshot,
} from '../models/customer.mapper';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly api = inject(ApiService);

  /** Descarga todas las filas del filtro (paginación 100, límite API). */
  fetchAllForExport(search = ''): Observable<Customer[]> {
    const batchSize = 100;
    const term = search.trim() || undefined;
    return this.list({ limit: batchSize, offset: 0, search: term }).pipe(
      switchMap((first) => {
        const total = first.total;
        if (first.items.length >= total || total === 0) {
          return of(first.items);
        }
        const pageCount = Math.ceil(total / batchSize);
        const pageRequests: Observable<CustomerListResult>[] = [];
        for (let page = 1; page < pageCount; page++) {
          pageRequests.push(
            this.list({ limit: batchSize, offset: page * batchSize, search: term }),
          );
        }
        return forkJoin(pageRequests).pipe(
          map((pages) => {
            const all = [...first.items];
            for (const p of pages) all.push(...p.items);
            return all;
          }),
        );
      }),
    );
  }

  list(params: {
    limit: number;
    offset: number;
    search?: string;
    documentNumber?: string;
  }): Observable<CustomerListResult> {
    const query: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.search?.trim()) query['search'] = params.search.trim();
    if (params.documentNumber?.trim()) {
      query['document_number'] = params.documentNumber.trim();
    }
    return this.api
      .get<Record<string, unknown>>('/api/customers', query)
      .pipe(map((resp) => mapCustomerList(resp)));
  }

  getById(customerId: number): Observable<Customer | null> {
    const id = Number(customerId);
    if (id <= 0) return of(null);
    return this.api
      .get<Record<string, unknown>>(`/api/customers/${id}`)
      .pipe(map((row) => mapCustomer(row)));
  }

  /** Alias compatible con citas. */
  getSnapshotById(customerId: number): Observable<CustomerSnapshot | null> {
    return this.getById(customerId).pipe(
      map((c) =>
        c
          ? {
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              phoneNumber: c.phoneNumber,
              email: c.email,
              documentType: c.documentType,
              documentNumber: c.documentNumber,
            }
          : null,
      ),
    );
  }

  findByDocument(documentNumber: string): Observable<CustomerSnapshot | null> {
    const doc = documentNumber.trim();
    return this.list({ limit: 1, offset: 0, documentNumber: doc }).pipe(
      map((res) => {
        const row = res.items[0];
        if (!row) return null;
        return mapCustomerSnapshot({
          id: row.id,
          first_name: row.firstName,
          last_name: row.lastName,
          phone_number: row.phoneNumber,
          email: row.email,
          document_type: row.documentType,
          document_number: row.documentNumber,
        });
      }),
    );
  }

  create(body: CustomerWritePayload): Observable<{ id: number }> {
    return this.api
      .post<{ id: number }>('/api/customers', body)
      .pipe(map((r) => ({ id: Number(r?.id ?? 0) })));
  }

  update(customerId: number, body: CustomerWritePayload): Observable<unknown> {
    return this.api.put(`/api/customers/${customerId}`, body);
  }

  delete(customerId: number): Observable<unknown> {
    return this.api.delete(`/api/customers/${customerId}`);
  }
}
