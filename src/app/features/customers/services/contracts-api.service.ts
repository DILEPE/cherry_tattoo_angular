import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CustomerContractRow } from '../models/customer.model';
import { mapCustomerContract } from '../models/customer.mapper';

@Injectable({ providedIn: 'root' })
export class ContractsApiService {
  private readonly api = inject(ApiService);

  listByCustomer(customerId: number): Observable<CustomerContractRow[]> {
    return this.api
      .get<Record<string, unknown>[]>(`/api/contracts/customer/${customerId}`)
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : []).map((r) =>
            mapCustomerContract(r),
          ),
        ),
      );
  }
}
