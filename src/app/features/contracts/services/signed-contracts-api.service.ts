import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CustomerSignedContractRow, SignedContract } from '../models/signed-contract.model';
import {
  mapCustomerSignedContract,
  mapSignedContract,
} from '../models/signed-contract.mapper';

@Injectable({ providedIn: 'root' })
export class SignedContractsApiService {
  private readonly api = inject(ApiService);

  listByCustomer(customerId: number): Observable<CustomerSignedContractRow[]> {
    return this.api
      .get<Record<string, unknown>[]>(`/api/contracts/customer/${customerId}`)
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : []).map((r) => mapCustomerSignedContract(r)),
        ),
      );
  }

  getById(contractId: number): Observable<SignedContract> {
    return this.api
      .get<Record<string, unknown>>(`/api/contracts/${contractId}`)
      .pipe(map((r) => mapSignedContract(r)));
  }
}
