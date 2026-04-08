import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { Buyer, CreateBuyerRequest, UpdateBuyerRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';

type BuyerFormGroup = FormGroup<{
  name: FormControl<string>;
}>;

@Component({
  selector: 'app-buyer-master',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DeleteConfirmationModalComponent],
  template: `
    <section class="card h-100 border-0 shadow-sm">
      <div class="card-body">
        <h2 class="h5 mb-3">Buyer Master</h2>
        <form [formGroup]="buyerForm" (ngSubmit)="addBuyer()" class="row g-3 align-items-end" novalidate>
          <div class="col-12 col-md-8">
            <label for="buyerName" class="form-label">Buyer Name <span class="text-danger">*</span></label>
            <input id="buyerName" type="text" formControlName="name" class="form-control" [class.is-invalid]="buyerForm.controls.name.touched && buyerForm.controls.name.invalid">
          </div>
          <div class="col-12 col-md-4 d-grid">
            <button type="submit" class="btn btn-primary">Add Buyer</button>
          </div>
        </form>
        <div class="mt-4 vstack gap-2" aria-label="Buyer list">
          @for (buyer of buyers(); track buyer.id) {
            <div class="border rounded p-2 d-flex align-items-center justify-content-between gap-2">
              @if (editingBuyerId() === buyer.id) {
                <form
                  [formGroup]="editBuyerForm"
                  class="d-flex align-items-center gap-2 flex-grow-1"
                  (ngSubmit)="updateBuyer(buyer.id)"
                  novalidate
                >
                  <input type="text" class="form-control" formControlName="name" [class.is-invalid]="editBuyerForm.controls.name.touched && editBuyerForm.controls.name.invalid" aria-label="Edit buyer name">
                  <button type="submit" class="btn btn-success btn-sm">Save</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                </form>
              } @else {
                <div class="fw-semibold">{{ buyer.name }}</div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-outline-warning btn-sm" (click)="startEdit(buyer)">Edit</button>
                  <button type="button" class="btn btn-outline-danger btn-sm" (click)="confirmDeleteBuyer(buyer)">Delete</button>
                </div>
              }
            </div>
          } @empty {
            <span class="text-body-secondary">No buyers found.</span>
          }
        </div>
      </div>

      <app-delete-confirmation-modal
        [isOpen]="pendingDeleteBuyer() !== null"
        title="Delete Buyer?"
        message="You are about to delete"
        [subjectName]="pendingDeleteBuyer()?.name ?? ''"
        confirmLabel="Delete Buyer"
        [isBusy]="isDeleting()"
        (onCancel)="cancelDeleteBuyer()"
        (onConfirm)="deleteBuyer()"
      ></app-delete-confirmation-modal>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyerMasterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly toaster = inject(ToasterService);

  readonly buyers = input.required<Buyer[]>();
  readonly onBuyerAdded = output<void>();
  readonly onBuyerUpdated = output<void>();
  readonly onBuyerDeleted = output<void>();

  readonly editingBuyerId = signal<number | null>(null);
  readonly pendingDeleteBuyer = signal<Buyer | null>(null);
  readonly isDeleting = signal(false);

  readonly buyerForm: BuyerFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)])
  });

  readonly editBuyerForm: BuyerFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)])
  });

  addBuyer(): void {
    if (this.buyerForm.invalid) {
      this.buyerForm.markAllAsTouched();
      return;
    }

    const payload: CreateBuyerRequest = this.buyerForm.getRawValue();
    this.api.addBuyer(payload).subscribe({
      next: () => {
        this.buyerForm.reset({ name: '' });
        this.onBuyerAdded.emit();
        this.toaster.success('Buyer added', 'Buyer created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add buyer right now.')
    });
  }

  confirmDeleteBuyer(buyer: Buyer): void {
    this.pendingDeleteBuyer.set(buyer);
  }

  cancelDeleteBuyer(): void {
    this.pendingDeleteBuyer.set(null);
  }

  deleteBuyer(): void {
    const buyer = this.pendingDeleteBuyer();
    if (!buyer) {
      return;
    }

    this.isDeleting.set(true);
    this.api.deleteBuyer(buyer.id).subscribe({
      next: () => {
        if (this.editingBuyerId() === buyer.id) {
          this.cancelEdit();
        }
        this.cancelDeleteBuyer();
        this.onBuyerDeleted.emit();
        this.toaster.info('Buyer removed', 'Buyer deleted successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to delete buyer.'),
      complete: () => this.isDeleting.set(false)
    });
  }

  startEdit(buyer: Buyer): void {
    this.editingBuyerId.set(buyer.id);
    this.editBuyerForm.reset({ name: buyer.name });
  }

  cancelEdit(): void {
    this.editingBuyerId.set(null);
    this.editBuyerForm.reset({ name: '' });
  }

  updateBuyer(id: number): void {
    if (this.editBuyerForm.invalid) {
      this.editBuyerForm.markAllAsTouched();
      return;
    }

    const payload: UpdateBuyerRequest = this.editBuyerForm.getRawValue();
    this.api.updateBuyer(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.onBuyerUpdated.emit();
        this.toaster.success('Buyer updated', 'Buyer updated successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to update buyer right now.')
    });
  }
}
