import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    @if (isOpen()) {
      <div class="modal fade show d-block app-delete-modal" tabindex="-1" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-body text-center p-4">
              <img ngSrc="/Logo.png" width="72" height="72" alt="Swadesh Packaging logo" class="brand-logo rounded mb-3">
              <h2 class="h5 mb-2" [id]="titleId">{{ title() }}</h2>
              <p class="text-body-secondary mb-3">{{ message() }} <span class="fw-semibold">{{ subjectName() }}</span>. This action cannot be undone.</p>
              <div class="d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-outline-secondary" (click)="onCancel.emit()">Cancel</button>
                <button type="button" class="btn btn-danger" [disabled]="isBusy()" (click)="onConfirm.emit()">
                  @if (isBusy()) { Deleting... } @else { {{ confirmLabel() }} }
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
export class DeleteConfirmationModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly subjectName = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly isBusy = input.required<boolean>();

  readonly onCancel = output<void>();
  readonly onConfirm = output<void>();

  readonly titleId = `delete-confirmation-title-${Math.random().toString(36).slice(2, 10)}`;
}