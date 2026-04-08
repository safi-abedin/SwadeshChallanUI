import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { Challan, Company, Buyer } from '../models/challan.models';

@Component({
  selector: 'app-delete-challan-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    @if (isOpen() && deletingChallan(); as challan) {
      <div class="modal fade show d-block app-delete-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="deleteChallanModalLabel">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-body text-center p-4">
              <img ngSrc="/Logo.png" width="72" height="72" alt="Swadesh Packaging logo" class="brand-logo rounded mb-3">
              <h2 class="h5 mb-2" id="deleteChallanModalLabel">Delete Challan?</h2>
              <p class="text-body-secondary mb-3">You are about to delete <span class="fw-semibold">{{ challan.challanNo }}</span>. This action cannot be undone.</p>
              <div class="d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-outline-secondary" (click)="onCancel.emit()">Cancel</button>
                <button type="button" class="btn btn-danger" [disabled]="isDeleting()" (click)="onConfirm.emit(challan.id)">
                  @if (isDeleting()) { Deleting... } @else { Delete Challan }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteChallanModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly deletingChallan = input.required<Challan | null>();
  readonly isDeleting = input.required<boolean>();

  readonly onCancel = output<void>();
  readonly onConfirm = output<number>();
}
