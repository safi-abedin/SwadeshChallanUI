import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ApiService } from '../services/api';
import { ToasterService } from '../services/toaster';
import { CreateProductRequest, Product, UpdateProductRequest } from '../models/challan.models';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';
import { splitSearchHighlight } from './master-search-highlight';

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
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Product Master</h2>
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">Add Product</button>
        </div>

        <div class="vstack gap-2" aria-label="Product list">
          @for (product of filteredProducts(); track product.id) {
            <div class="master-item d-flex align-items-center justify-content-between gap-2">
              <div class="fw-semibold">
                @for (segment of highlightSegments(product.name); track $index) {
                  @if (segment.matched) {
                    <mark class="search-highlight">{{ segment.text }}</mark>
                  } @else {
                    <span>{{ segment.text }}</span>
                  }
                }
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-outline-warning btn-sm" (click)="startEdit(product)">Edit</button>
                <button type="button" class="btn btn-outline-danger btn-sm" (click)="confirmDeleteProduct(product)">Delete</button>
              </div>
            </div>
          } @empty {
            <div class="text-body-secondary">No products found.</div>
          }
        </div>
      </div>

      @if (isCreateModalOpen()) {
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="create-product-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="create-product-title">Add Product</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="closeCreateModal()"></button>
              </div>
              <form [formGroup]="productForm" (ngSubmit)="addProduct()" novalidate>
                <div class="modal-body">
                  <label for="productNameCreate" class="form-label">Product Name <span class="text-danger">*</span></label>
                  <input id="productNameCreate" type="text" formControlName="name" class="form-control" [class.is-invalid]="productForm.controls.name.touched && productForm.controls.name.invalid">
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
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title h5 mb-0" id="edit-product-title">Edit Product</h3>
                <button type="button" class="btn-close" aria-label="Close" (click)="cancelEdit()"></button>
              </div>
              <form [formGroup]="editProductForm" (ngSubmit)="updateProduct()" novalidate>
                <div class="modal-body">
                  <label for="productNameEdit" class="form-label">Product Name <span class="text-danger">*</span></label>
                  <input id="productNameEdit" type="text" class="form-control" formControlName="name" [class.is-invalid]="editProductForm.controls.name.touched && editProductForm.controls.name.invalid">
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
  readonly searchQuery = input('');
  readonly onProductAdded = output<void>();
  readonly onProductUpdated = output<void>();
  readonly onProductDeleted = output<void>();

  readonly editingProductId = signal<number | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly pendingDeleteProduct = signal<Product | null>(null);
  readonly isDeleting = signal(false);

  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().trim();
    const products = this.products();

    if (!query) {
      return products;
    }

    try {
      const regex = new RegExp(query, 'i');
      return products.filter((product) => regex.test(product.name));
    } catch {
      // Invalid regex, return all products
      return products;
    }
  });

  highlightSegments(text: string) {
    return splitSearchHighlight(text, this.searchQuery());
  }

  readonly productForm: ProductFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(120)])
  });

  readonly editProductForm: ProductFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(120)])
  });

  openCreateModal(): void {
    this.productForm.reset({ name: '' });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.productForm.reset({ name: '' });
  }

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
        this.closeCreateModal();
        this.onProductAdded.emit();
        this.toaster.success('Product added', 'Product created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add product right now.')
    });
  }

  startEdit(product: Product): void {
    this.editingProductId.set(product.id);
    this.isEditModalOpen.set(true);
    this.editProductForm.reset({ name: product.name });
  }

  cancelEdit(): void {
    this.editingProductId.set(null);
    this.isEditModalOpen.set(false);
    this.editProductForm.reset({ name: '' });
  }

  updateProduct(): void {
    const id = this.editingProductId();
    if (!id) {
      return;
    }

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
