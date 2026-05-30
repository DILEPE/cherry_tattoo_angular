import {

  ChangeDetectionStrategy,

  Component,

  computed,

  effect,

  inject,

  signal,

} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import { SignedContractsApiService } from '../../../contracts/services/signed-contracts-api.service';

import { UiStore } from '../../../../store/ui.store';

import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';

import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';

import { resolveCustomerModalId, resolveCustomerModalName } from '../customer-modal.util';

import { CustomerSignedContractRow } from '../../../contracts/models/signed-contract.model';

import { ErrorService } from '../../../../core/services/error.service';



function looksLikeHtml(s: string): boolean {

  return /<\/?[a-z][\s\S]*>/i.test(s);

}



@Component({

  selector: 'app-customer-contracts-dialog',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [AppButtonComponent, AppSkeletonComponent, AppIconActionButtonComponent],

  template: `

    <p class="appt-dialog-caption">

      <strong>{{ name() }}</strong> · ID {{ customerId() }}

    </p>



    @if (view() === 'read') {

      <p class="appt-dialog-caption">Contrato #{{ selected()?.id }} · Cita #{{ selected()?.appointmentId }}</p>

      @if (readLoading()) {

        <app-skeleton [rows]="6" />

      } @else if (readError()) {

        <p class="form-field__error">{{ readError() }}</p>

      } @else if (!hasReadText()) {

        <p class="empty-state">Este contrato no tiene texto guardado.</p>

      } @else if (readIsHtml()) {

        <div class="ct-read-shell ct-read-shell--html" [innerHTML]="safeReadHtml()"></div>

      } @else {

        <div class="ct-read-shell ct-read-shell--plain">{{ readText() }}</div>

      }

      <div class="appt-dialog-actions">

        <app-button variant="ghost" (clicked)="backToList()">← Volver al listado</app-button>

        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>

      </div>

    } @else {

      @if (loading()) {

        <app-skeleton [rows]="4" />

      } @else if (error()) {

        <p class="form-field__error">{{ error() }}</p>

      } @else if (!rows().length) {

        <p class="empty-state">Este cliente no tiene contratos firmados.</p>

      } @else {

        <div class="cust-table-wrap">

          <table class="cust-table">

            <thead>

              <tr>

                <th><span class="cust-col-head">ID</span></th>

                <th><span class="cust-col-head">Cita</span></th>

                <th><span class="cust-col-head">Servicio</span></th>

                <th><span class="cust-col-head">Fecha cita</span></th>

                <th><span class="cust-col-head cust-col-head--actions">Acciones</span></th>

              </tr>

            </thead>

            <tbody>

              @for (r of rows(); track r.id) {

                <tr>

                  <td>{{ r.id }}</td>

                  <td>{{ r.appointmentId }}</td>

                  <td>{{ r.serviceType }}</td>

                  <td>{{ r.appointmentDate || '—' }}</td>

                  <td class="cust-row-actions">

                    <button

                      appIconAction="document"

                      title="Ver contenido del contrato"

                      (click)="openRead(r)"

                    ></button>

                  </td>

                </tr>

              }

            </tbody>

          </table>

        </div>

      }

      <div class="appt-dialog-actions">

        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>

      </div>

    }

  `,

})

export class CustomerContractsDialogComponent {

  private readonly api = inject(SignedContractsApiService);

  private readonly ui = inject(UiStore);

  private readonly errors = inject(ErrorService);

  private readonly sanitizer = inject(DomSanitizer);



  readonly loading = signal(true);

  readonly error = signal<string | null>(null);

  readonly rows = signal<CustomerSignedContractRow[]>([]);

  readonly name = signal(resolveCustomerModalName(this.ui));

  readonly customerId = signal(resolveCustomerModalId(this.ui));



  readonly view = signal<'list' | 'read'>('list');

  readonly selected = signal<CustomerSignedContractRow | null>(null);

  readonly readLoading = signal(false);

  readonly readError = signal<string | null>(null);

  readonly readText = signal('');



  readonly readIsHtml = computed(() => looksLikeHtml(this.readText()));

  readonly hasReadText = computed(() => !!this.readText().trim());

  readonly safeReadHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.readText()));



  private readonly _load = effect(() => {

    const id = resolveCustomerModalId(this.ui);

    if (id <= 0 || this.ui.activeModal()?.id !== 'customer-contracts') return;

    this.customerId.set(id);

    this.view.set('list');

    this.selected.set(null);

    this.loading.set(true);

    this.api.listByCustomer(id).subscribe({

      next: (list) => {

        this.rows.set(list);

        this.loading.set(false);

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set('No se pudieron cargar los contratos.');

        this.errors.handle(err);

      },

    });

  });



  openRead(row: CustomerSignedContractRow): void {

    this.selected.set(row);

    this.view.set('read');

    this.readLoading.set(true);

    this.readError.set(null);

    this.readText.set('');

    this.api.getById(row.id).subscribe({

      next: (c) => {

        this.readText.set((c.contractText ?? '').trim());

        this.readLoading.set(false);

      },

      error: (err) => {

        this.readLoading.set(false);

        this.readError.set('No se pudo cargar el contrato.');

        this.errors.handle(err);

      },

    });

  }



  backToList(): void {

    this.view.set('list');

    this.selected.set(null);

    this.readText.set('');

  }



  close(): void {

    this.ui.closeModal();

  }

}

