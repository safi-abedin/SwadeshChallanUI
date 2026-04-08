import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ApiService } from './services/api';
import { AuthService } from './services/auth';
import { LoadingService } from './services/loading';
import { ToasterService } from './services/toaster';

import { Buyer, Challan, ChallanDto, Company, Product } from './models/challan.models';

import { CompanyMasterComponent } from './components/company-master.component';
import { BuyerMasterComponent } from './components/buyer-master.component';
import { ProductMasterComponent } from './components/product-master.component';
import { ChallanFormComponent } from './components/challan-form.component';
import { ChallanListComponent } from './components/challan-list.component';
import { ViewChallanModalComponent } from './components/view-challan-modal.component';
import { EditChallanModalComponent } from './components/edit-challan-modal.component';
import { DeleteChallanModalComponent } from './components/delete-challan-modal.component';

type TabKey = 'challan' | 'masters' | 'reports';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    CompanyMasterComponent,
    BuyerMasterComponent,
    ProductMasterComponent,
    ChallanFormComponent,
    ChallanListComponent,
    ViewChallanModalComponent,
    EditChallanModalComponent,
    DeleteChallanModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly toaster = inject(ToasterService);

  readonly currentUser = this.auth.currentUser;
  readonly isLoading = this.loading.isLoading;

  readonly companies = signal<Company[]>([]);
  readonly buyers = signal<Buyer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly challans = signal<Challan[]>([]);

  // Pagination state
  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly sortBy = signal('date');
  readonly sortOrder = signal('desc');
  readonly search = signal('');

  // Computed pagination flags
  readonly hasNextPage = computed(() => this.pageNumber() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.pageNumber() > 1);
  
  readonly activeTab = signal<TabKey>('challan');
  readonly isSubmitting = signal(false);
  readonly isUpdating = signal(false);
  readonly isDeleting = signal(false);

  // View/Edit/Delete Modal states
  readonly viewingChallan = signal<Challan | null>(null);
  readonly isViewModalOpen = signal(false);
  
  readonly editingChallanId = signal<number | null>(null);
  readonly editingChallanNo = signal('');
  readonly editingChallan = signal<Challan | null>(null);
  readonly isEditModalOpen = signal(false);
  
  readonly deletingChallan = signal<Challan | null>(null);
  readonly isDeleteModalOpen = signal(false);

  constructor() {
    this.loadInitialData();
  }

  setActiveTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Master Data Management
  private loadInitialData(): void {
    forkJoin({
      companies: this.api.getCompanies(),
      buyers: this.api.getBuyers(),
      products: this.api.getProducts(),
      challans: this.api.getChallansPaginated(
        this.pageNumber(),
        this.pageSize(),
        this.search() || undefined,
        this.sortBy(),
        this.sortOrder()
      )
    }).subscribe({
      next: ({ companies, buyers, products, challans }) => {
        this.companies.set(companies);
        this.buyers.set(buyers);
        this.products.set(products);
        this.challans.set(challans.data);
        this.totalCount.set(challans.totalCount);
        this.totalPages.set(challans.totalPages);
        this.pageNumber.set(challans.pageNumber);
      },
      error: () => this.toaster.error('Load failed', 'Could not load data. Please verify backend is running.')
    });
  }

  private refreshMasterData(): void {
    forkJoin({
      companies: this.api.getCompanies(),
      buyers: this.api.getBuyers(),
      products: this.api.getProducts()
    }).subscribe({
      next: ({ companies, buyers, products }) => {
        this.companies.set(companies);
        this.buyers.set(buyers);
        this.products.set(products);
      }
    });
  }

  private refreshChallans(): void {
    this.api.getChallansPaginated(
      this.pageNumber(),
      this.pageSize(),
      this.search() || undefined,
      this.sortBy(),
      this.sortOrder()
    ).subscribe({
      next: (response) => {
        this.challans.set(response.data);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.pageNumber.set(response.pageNumber);
      }
    });
  }

  onCompanyAdded(): void {
    this.refreshMasterData();
  }

  onCompanyDeleted(): void {
    this.refreshMasterData();
  }

  onCompanyUpdated(): void {
    this.refreshMasterData();
  }

  onBuyerAdded(): void {
    this.refreshMasterData();
  }

  onBuyerDeleted(): void {
    this.refreshMasterData();
  }

  onBuyerUpdated(): void {
    this.refreshMasterData();
  }

  onProductAdded(): void {
    this.refreshMasterData();
  }

  onProductUpdated(): void {
    this.refreshMasterData();
  }

  onProductDeleted(): void {
    this.refreshMasterData();
  }

  onChallanFormSubmit(payload: ChallanDto): void {
    this.isSubmitting.set(true);
    this.api.createChallan(payload).subscribe({
      next: () => {
        this.refreshChallans();
        this.toaster.success('Challan created', 'Challan created successfully.');
        this.activeTab.set('reports');
      },
      error: () => this.toaster.error('Action failed', 'Unable to create challan. Please try again.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

  // Challan List Handlers
  viewChallan(challanId: number): void {
    this.api.getChallanById(challanId).subscribe({
      next: (challan) => {
        this.viewingChallan.set(challan);
        this.isViewModalOpen.set(true);
      },
      error: () => this.toaster.error('Action failed', 'Unable to load challan details.')
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.viewingChallan.set(null);
  }

  editChallan(challanId: number): void {
    this.api.getChallanById(challanId).subscribe({
      next: (challan) => {
        this.editingChallanId.set(challan.id);
        this.editingChallanNo.set(challan.challanNo);
        this.editingChallan.set(challan);
        this.isEditModalOpen.set(true);
      },
      error: () => this.toaster.error('Action failed', 'Unable to load challan for edit.')
    });
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingChallanId.set(null);
    this.editingChallanNo.set('');
    this.editingChallan.set(null);
  }

  submitEditChallan(payload: ChallanDto): void {
    const id = this.editingChallanId();
    if (!id) return;

    this.isUpdating.set(true);
    this.api.updateChallan(id, payload).subscribe({
      next: () => {
        this.refreshChallans();
        this.closeEditModal();
        this.toaster.success('Challan updated', 'Challan updated successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to update challan. Please try again.'),
      complete: () => this.isUpdating.set(false)
    });
  }

  openDeleteModal(challan: Challan): void {
    this.deletingChallan.set(challan);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingChallan.set(null);
    this.isDeleting.set(false);
  }

  confirmDeleteChallan(challanId: number): void {
    this.isDeleting.set(true);
    this.api.deleteChallan(challanId).subscribe({
      next: () => {
        if (this.editingChallanId() === challanId) {
          this.closeEditModal();
        }
        if (this.viewingChallan()?.id === challanId) {
          this.closeViewModal();
        }
        this.closeDeleteModal();
        this.refreshChallans();
        this.toaster.success('Challan deleted', 'Challan deleted successfully.');
      },
      error: () => {
        this.isDeleting.set(false);
        this.toaster.error('Action failed', 'Unable to delete challan right now.');
      }
    });
  }

  downloadPdf(id: number): void {
    this.api.getChallanPdf(id).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener,noreferrer');

        const link = document.createElement('a');
        link.href = url;
        link.download = `challan-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.toaster.error('PDF unavailable', 'Unable to open PDF right now.')
    });
  }

  // List Filter/Pagination Handlers
  onSearchChallans(searchTerm: string): void {
    this.search.set(searchTerm);
    this.pageNumber.set(1);
    this.refreshChallans();
  }

  onSortByChange(sortBy: string): void {
    this.sortBy.set(sortBy);
    this.refreshChallans();
  }

  onSortOrderChange(sortOrder: string): void {
    this.sortOrder.set(sortOrder);
    this.refreshChallans();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.refreshChallans();
  }

  onResetFilters(): void {
    this.search.set('');
    this.sortBy.set('date');
    this.sortOrder.set('desc');
    this.pageNumber.set(1);
    this.refreshChallans();
  }
}