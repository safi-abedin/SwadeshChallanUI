import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';

type CompanyFormGroup = FormGroup<{
  name: FormControl<string>;
  address: FormControl<string>;
}>;

@Component({
  selector: 'app-company-master',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DeleteConfirmationModalComponent],
  template: `
    <section class="card h-100 border-0 shadow-sm">
      <div class="card-body">
        <h2 class="h5 mb-3">Company Master</h2>
        <form [formGroup]="companyForm" (ngSubmit)="addCompany()" class="vstack gap-3" novalidate>
          <div>
            <label for="companyName" class="form-label">Company Name <span class="text-danger">*</span></label>
            <input id="companyName" type="text" formControlName="name" class="form-control" [class.is-invalid]="companyForm.controls.name.touched && companyForm.controls.name.invalid">
          </div>
          <div>
            <label for="companyAddress" class="form-label">Address <span class="text-danger">*</span></label>
            <textarea id="companyAddress" rows="2" formControlName="address" class="form-control" [class.is-invalid]="companyForm.controls.address.touched && companyForm.controls.address.invalid"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Add Company</button>
        </form>
        <hr class="my-4">
        <div class="vstack gap-2 master-list" aria-label="Company list">
          @for (company of companies(); track company.id) {
            <div class="border rounded p-2 d-flex align-items-start justify-content-between gap-2">
              @if (editingCompanyId() === company.id) {
                <form [formGroup]="editCompanyForm" class="vstack gap-2 flex-grow-1" (ngSubmit)="updateCompany(company.id)" novalidate>
                  <input type="text" formControlName="name" class="form-control" [class.is-invalid]="editCompanyForm.controls.name.touched && editCompanyForm.controls.name.invalid" aria-label="Edit company name">
                  <textarea rows="2" formControlName="address" class="form-control" [class.is-invalid]="editCompanyForm.controls.address.touched && editCompanyForm.controls.address.invalid" aria-label="Edit company address"></textarea>
                  <div class="d-flex align-items-center gap-2">
                    <button type="submit" class="btn btn-success btn-sm">Save</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                  </div>
                </form>
              } @else {
                <div>
                  <div class="fw-semibold">{{ company.name }}</div>
                  <div class="text-body-secondary">{{ company.address }}</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-outline-warning btn-sm" (click)="startEdit(company)">Edit</button>
                  <button type="button" class="btn btn-outline-danger btn-sm" (click)="confirmDeleteCompany(company)">Delete</button>
                </div>
              }
            </div>
          } @empty {
            <div class="text-body-secondary">No companies found.</div>
          }
        </div>
      </div>

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
  readonly onCompanyAdded = output<void>();
  readonly onCompanyUpdated = output<void>();
  readonly onCompanyDeleted = output<void>();

  readonly editingCompanyId = signal<number | null>(null);
  readonly pendingDeleteCompany = signal<Company | null>(null);
  readonly isDeleting = signal(false);

  readonly companyForm: CompanyFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.required, Validators.maxLength(250)])
  });

  readonly editCompanyForm: CompanyFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.required, Validators.maxLength(250)])
  });

  addCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    const payload: CreateCompanyRequest = this.companyForm.getRawValue();
    this.api.addCompany(payload).subscribe({
      next: () => {
        this.companyForm.reset({ name: '', address: '' });
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
      error: () => this.toaster.error('Action failed', 'Unable to delete company.'),
      complete: () => this.isDeleting.set(false)
    });
  }

  startEdit(company: Company): void {
    this.editingCompanyId.set(company.id);
    this.editCompanyForm.reset({
      name: company.name,
      address: company.address
    });
  }

  cancelEdit(): void {
    this.editingCompanyId.set(null);
    this.editCompanyForm.reset({ name: '', address: '' });
  }

  updateCompany(id: number): void {
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
}
