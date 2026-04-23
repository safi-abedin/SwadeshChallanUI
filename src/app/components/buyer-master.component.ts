import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { Buyer, CreateBuyerRequest, UpdateBuyerRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';
import { splitSearchHighlight } from './master-search-highlight';

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
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Buyer Master</h2>
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">Add Buyer</button>
        </div>

        <div class="vstack gap-2" aria-label="Buyer list">
          @for (buyer of filteredBuyers(); track buyer.id) {
            <div class="master-item d-flex align-items-center justify-content-between gap-2">
              <div class="fw-semibold">
                @for (segment of highlightSegments(buyer.name); track $index) {
                  @if (segment.matched) {
                    <mark class="search-highlight">{{ segment.text }}</mark>
                  } @else {
                    <span>{{ segment.text }}</span>
                  }
                }
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-outline-warning btn-sm" (click)="startEdit(buyer)">Edit</button>
                <button type="button" class="btn btn-outline-danger btn-sm" (click)="confirmDeleteBuyer(buyer)">Delete</button>
              </div>
            </div>
          } @empty {
            <span class="text-body-secondary">No buyers found.</span>
          }
        </div>
      </div>

      @if (isCreateModalOpen()) {
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="create-buyer-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="create-buyer-title">Add Buyer</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="closeCreateModal()"></button>
              </div>
              <form [formGroup]="buyerForm" (ngSubmit)="addBuyer()" novalidate>
                <div class="modal-body">
                  <label for="buyerNameCreate" class="form-label">Buyer Name <span class="text-danger">*</span></label>
                  <input id="buyerNameCreate" type="text" formControlName="name" class="form-control" [class.is-invalid]="buyerForm.controls.name.touched && buyerForm.controls.name.invalid">
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
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="edit-buyer-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="edit-buyer-title">Edit Buyer</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="cancelEdit()"></button>
              </div>
              <form [formGroup]="editBuyerForm" (ngSubmit)="updateBuyer()" novalidate>
                <div class="modal-body">
                  <label for="buyerNameEdit" class="form-label">Buyer Name <span class="text-danger">*</span></label>
                  <input id="buyerNameEdit" type="text" class="form-control" formControlName="name" [class.is-invalid]="editBuyerForm.controls.name.touched && editBuyerForm.controls.name.invalid">
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
  readonly searchQuery = input('');
  readonly onBuyerAdded = output<void>();
  readonly onBuyerUpdated = output<void>();
  readonly onBuyerDeleted = output<void>();

  readonly editingBuyerId = signal<number | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly pendingDeleteBuyer = signal<Buyer | null>(null);
  readonly isDeleting = signal(false);

  readonly filteredBuyers = computed(() => {
    const query = this.searchQuery().trim();
    const buyers = this.buyers();

    if (!query) {
      return buyers;
    }

    try {
      const regex = new RegExp(query, 'i');
      return buyers.filter((buyer) => regex.test(buyer.name));
    } catch {
      // Invalid regex, return all buyers
      return buyers;
    }
  });

  highlightSegments(text: string) {
    return splitSearchHighlight(text, this.searchQuery());
  }

  readonly buyerForm: BuyerFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)])
  });

  readonly editBuyerForm: BuyerFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)])
  });

  openCreateModal(): void {
    this.buyerForm.reset({ name: '' });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.buyerForm.reset({ name: '' });
  }

  addBuyer(): void {
    if (this.buyerForm.invalid) {
      this.buyerForm.markAllAsTouched();
      return;
    }

    const payload: CreateBuyerRequest = this.buyerForm.getRawValue();
    this.api.addBuyer(payload).subscribe({
      next: () => {
        this.closeCreateModal();
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
    this.isEditModalOpen.set(true);
    this.editBuyerForm.reset({ name: buyer.name });
  }

  cancelEdit(): void {
    this.editingBuyerId.set(null);
    this.isEditModalOpen.set(false);
    this.editBuyerForm.reset({ name: '' });
  }

  updateBuyer(): void {
    const id = this.editingBuyerId();
    if (!id) {
      return;
    }

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
