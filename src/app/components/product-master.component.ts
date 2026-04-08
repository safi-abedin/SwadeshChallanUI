import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { CreateProductRequest, Product, UpdateProductRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';

type ProductFormGroup = FormGroup<{
  name: FormControl<string>;
}>;

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DeleteConfirmationModalComponent],
  template: `
    <section class="card h-100 border-0 shadow-sm">
      <div class="card-body">
        <h2 class="h5 mb-3">Product Master</h2>

        <form [formGroup]="productForm" (ngSubmit)="addProduct()" class="row g-3 align-items-end" novalidate>
          <div class="col-12 col-md-8">
            <label for="productName" class="form-label">Product Name <span class="text-danger">*</span></label>
            <input
              id="productName"
              type="text"
              formControlName="name"
              class="form-control"
              [class.is-invalid]="productForm.controls.name.touched && productForm.controls.name.invalid"
            >
          </div>
          <div class="col-12 col-md-4 d-grid">
            <button type="submit" class="btn btn-primary">Add Product</button>
          </div>
        </form>

        <hr class="my-4">

        <div class="vstack gap-2" aria-label="Product list">
          @for (product of products(); track product.id) {
            <div class="border rounded p-2 d-flex align-items-center justify-content-between gap-2">
              @if (editingProductId() === product.id) {
                <form
                  [formGroup]="editProductForm"
                  class="d-flex align-items-center gap-2 flex-grow-1"
                  (ngSubmit)="updateProduct(product.id)"
                  novalidate
                >
                  <input
                    type="text"
                    class="form-control"
                    formControlName="name"
                    [class.is-invalid]="editProductForm.controls.name.touched && editProductForm.controls.name.invalid"
                    aria-label="Edit product name"
                  >
                  <button type="submit" class="btn btn-success btn-sm">Save</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                </form>
              } @else {
                <div class="fw-semibold">{{ product.name }}</div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-outline-warning btn-sm" (click)="startEdit(product)">Edit</button>
                  <button type="button" class="btn btn-outline-danger btn-sm" (click)="confirmDeleteProduct(product)">Delete</button>
                </div>
              }
            </div>
          } @empty {
            <div class="text-body-secondary">No products found.</div>
          }
        </div>
      </div>

      <app-delete-confirmation-modal
        [isOpen]="pendingDeleteProduct() !== null"
        title="Delete Product?"
        message="You are about to delete"
        [subjectName]="pendingDeleteProduct()?.name ?? ''"
        confirmLabel="Delete Product"
        [isBusy]="isDeleting()"
        (onCancel)="cancelDeleteProduct()"
        (onConfirm)="deleteProduct()"
      ></app-delete-confirmation-modal>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductMasterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly toaster = inject(ToasterService);

  readonly products = input.required<Product[]>();
  readonly onProductAdded = output<void>();
  readonly onProductUpdated = output<void>();
  readonly onProductDeleted = output<void>();

  readonly editingProductId = signal<number | null>(null);
  readonly pendingDeleteProduct = signal<Product | null>(null);
  readonly isDeleting = signal(false);

  readonly productForm: ProductFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(120)])
  });

  readonly editProductForm: ProductFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(120)])
  });

  confirmDeleteProduct(product: Product): void {
    this.pendingDeleteProduct.set(product);
  }

  cancelDeleteProduct(): void {
    this.pendingDeleteProduct.set(null);
  }

  addProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload: CreateProductRequest = this.productForm.getRawValue();
    this.api.addProduct(payload).subscribe({
      next: () => {
        this.productForm.reset({ name: '' });
        this.onProductAdded.emit();
        this.toaster.success('Product added', 'Product created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add product right now.')
    });
  }

  startEdit(product: Product): void {
    this.editingProductId.set(product.id);
    this.editProductForm.reset({ name: product.name });
  }

  cancelEdit(): void {
    this.editingProductId.set(null);
    this.editProductForm.reset({ name: '' });
  }

  updateProduct(id: number): void {
    if (this.editProductForm.invalid) {
      this.editProductForm.markAllAsTouched();
      return;
    }

    const payload: UpdateProductRequest = this.editProductForm.getRawValue();
    this.api.updateProduct(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.onProductUpdated.emit();
        this.toaster.success('Product updated', 'Product updated successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to update product right now.')
    });
  }

  deleteProduct(): void {
    const product = this.pendingDeleteProduct();
    if (!product) {
      return;
    }

    this.isDeleting.set(true);
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        if (this.editingProductId() === product.id) {
          this.cancelEdit();
        }
        this.cancelDeleteProduct();
        this.onProductDeleted.emit();
        this.toaster.info('Product removed', 'Product deleted successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to delete product.'),
      complete: () => this.isDeleting.set(false)
    });
  }
}
