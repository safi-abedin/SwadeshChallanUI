import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';
import { splitSearchHighlight } from './master-search-highlight';

type CompanyFormGroup = FormGroup<{
  name: FormControl<string>;
  address: FormControl<string>;
}>;

@Component({
  selector: 'app-company-master',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DeleteConfirmationModalComponent],
  template: `
    <section class="card border-0 shadow-sm master-card">
      <div class="card-body p-3 p-lg-4">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center master-toolbar mb-3">
          <h2 class="h5 mb-0">Company Master</h2>
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">Add Company</button>
        </div>

        <div class="master-list" aria-label="Company list">
          @for (company of filteredCompanies(); track company.id) {
            <div class="master-item d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mt-3 border-bottom pb-2">
              <div class="text-break">
                <div class="fw-semibold mb-1">
                  @for (segment of highlightSegments(company.name); track $index) {
                    @if (segment.matched) {
                      <mark class="search-highlight">{{ segment.text }}</mark>
                    } @else {
                      <span>{{ segment.text }}</span>
                    }
                  }
                </div>
                <div class="text-body-secondary small">
                  @for (segment of highlightSegments(company.address); track $index) {
                    @if (segment.matched) {
                      <mark class="search-highlight">{{ segment.text }}</mark>
                    } @else {
                      <span>{{ segment.text }}</span>
                    }
                  }
                </div>
              </div>
              <div class="master-actions d-flex align-items-center gap-2">
                <button type="button" class="btn btn-outline-warning btn-sm master-action-btn" (click)="startEdit(company)">Edit</button>
                <button type="button" class="btn btn-outline-danger btn-sm master-action-btn" (click)="confirmDeleteCompany(company)">Delete</button>
              </div>
            </div>
          } @empty {
            <div class="text-body-secondary">No companies found.</div>
          }
        </div>
      </div>

      @if (isCreateModalOpen()) {
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="create-company-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="create-company-title">Add Company</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="closeCreateModal()"></button>
              </div>
              <form [formGroup]="companyForm" (ngSubmit)="addCompany()" novalidate>
                <div class="modal-body vstack gap-3">
                  <div>
                    <label for="companyNameCreate" class="form-label">Company Name <span class="text-danger">*</span></label>
                    <input id="companyNameCreate" type="text" formControlName="name" class="form-control" [class.is-invalid]="companyForm.controls.name.touched && companyForm.controls.name.invalid">
                  </div>
                  <div>
                    <label for="companyAddressCreate" class="form-label">Address <span class="text-danger">*</span></label>
                    <textarea id="companyAddressCreate" rows="2" formControlName="address" class="form-control" [class.is-invalid]="companyForm.controls.address.touched && companyForm.controls.address.invalid"></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" (click)="closeCreateModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal-backdrop fade show"></div>
      }

      @if (isEditModalOpen()) {
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="edit-company-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="edit-company-title">Edit Company</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="cancelEdit()"></button>
              </div>
              <form [formGroup]="editCompanyForm" (ngSubmit)="updateCompany()" novalidate>
                <div class="modal-body vstack gap-3">
                  <div>
                    <label for="companyNameEdit" class="form-label">Company Name <span class="text-danger">*</span></label>
                    <input id="companyNameEdit" type="text" formControlName="name" class="form-control" [class.is-invalid]="editCompanyForm.controls.name.touched && editCompanyForm.controls.name.invalid">
                  </div>
                  <div>
                    <label for="companyAddressEdit" class="form-label">Address <span class="text-danger">*</span></label>
                    <textarea id="companyAddressEdit" rows="2" formControlName="address" class="form-control" [class.is-invalid]="editCompanyForm.controls.address.touched && editCompanyForm.controls.address.invalid"></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" (click)="cancelEdit()">Cancel</button>
                  <button type="submit" class="btn btn-success">Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal-backdrop fade show"></div>
      }

      <app-delete-confirmation-modal
        [isOpen]="pendingDeleteCompany() !== null"
        title="Delete Company?"
        message="You are about to delete"
        [subjectName]="pendingDeleteCompany()?.name ?? ''"
        confirmLabel="Delete Company"
        [isBusy]="isDeleting()"
        (onCancel)="cancelDeleteCompany()"
        (onConfirm)="deleteCompany()"
      ></app-delete-confirmation-modal>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyMasterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly toaster = inject(ToasterService);

  readonly companies = input.required<Company[]>();
  readonly searchQuery = input('');
  readonly onCompanyAdded = output<void>();
  readonly onCompanyUpdated = output<void>();
  readonly onCompanyDeleted = output<void>();

  readonly editingCompanyId = signal<number | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly pendingDeleteCompany = signal<Company | null>(null);
  readonly isDeleting = signal(false);

  readonly filteredCompanies = computed(() => {
    const query = this.searchQuery().trim();
    const companies = this.companies();

    if (!query) {
      return companies;
    }

    try {
      const regex = new RegExp(query, 'i');
      return companies.filter((company) => regex.test(company.name) || regex.test(company.address));
    } catch {
      // Invalid regex, return all companies
      return companies;
    }
  });

  highlightSegments(text: string) {
    return splitSearchHighlight(text, this.searchQuery());
  }

  readonly companyForm: CompanyFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.required, Validators.maxLength(250)])
  });

  readonly editCompanyForm: CompanyFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.required, Validators.maxLength(250)])
  });

  openCreateModal(): void {
    this.companyForm.reset({ name: '', address: '' });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.companyForm.reset({ name: '', address: '' });
  }

  addCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    const payload: CreateCompanyRequest = this.companyForm.getRawValue();
    this.api.addCompany(payload).subscribe({
      next: () => {
        this.closeCreateModal();
        this.onCompanyAdded.emit();
        this.toaster.success('Company added', 'Company created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add company right now.')
    });
  }

  confirmDeleteCompany(company: Company): void {
    this.pendingDeleteCompany.set(company);
  }

  cancelDeleteCompany(): void {
    this.pendingDeleteCompany.set(null);
  }

  deleteCompany(): void {
    const company = this.pendingDeleteCompany();
    if (!company) {
      return;
    }

    this.isDeleting.set(true);
    this.api.deleteCompany(company.id).subscribe({
      next: () => {
        if (this.editingCompanyId() === company.id) {
          this.cancelEdit();
        }
        this.cancelDeleteCompany();
        this.onCompanyDeleted.emit();
        this.toaster.info('Company removed', 'Company deleted successfully.');
      },
      error: (error: unknown) => {
        this.cancelDeleteCompany();

        const message = this.extractErrorMessage(error, 'Unable to delete company right now.');
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.toaster.warning('Cannot delete company', message, 7000);
          return;
        }

        this.toaster.error('Action failed', message);
      },
      complete: () => this.isDeleting.set(false)
    });
  }

  startEdit(company: Company): void {
    this.editingCompanyId.set(company.id);
    this.isEditModalOpen.set(true);
    this.editCompanyForm.reset({
      name: company.name,
      address: company.address
    });
  }

  cancelEdit(): void {
    this.editingCompanyId.set(null);
    this.isEditModalOpen.set(false);
    this.editCompanyForm.reset({ name: '', address: '' });
  }

  updateCompany(): void {
    const id = this.editingCompanyId();
    if (!id) {
      return;
    }

    if (this.editCompanyForm.invalid) {
      this.editCompanyForm.markAllAsTouched();
      return;
    }

    const payload: UpdateCompanyRequest = this.editCompanyForm.getRawValue();
    this.api.updateCompany(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.onCompanyUpdated.emit();
        this.toaster.success('Company updated', 'Company updated successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to update company right now.')
    });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error.trim();
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string' &&
      error.error.message.trim().length > 0
    ) {
      return error.error.message.trim();
    }

    return fallback;
  }
}
