import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Challan, Company, Buyer } from '../models/challan.models';

@Component({
  selector: 'app-challan-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="h5 mb-0">Recent Challans</h2>
        </div>

        <!-- Filters Section -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-md-4">
            <input
              type="text"
              class="form-control"
              placeholder="Search challan, job no, product..."
              [(ngModel)]="searchValue"
              (keyup.enter)="onSearchChange()"
              (ngModelChange)="onSearchChange()"
            >
          </div>
          <div class="col-12 col-md-3">
            <select class="form-select" [(ngModel)]="sortByValue" (ngModelChange)="onSortByChangeClick()">
              <option value="date">Sort by Date</option>
              <option value="challanno">Sort by Challan No</option>
              <option value="jobno">Sort by Job No</option>
              <option value="productname">Sort by Product</option>
              <option value="company">Sort by Company</option>
              <option value="buyer">Sort by Buyer</option>
            </select>
          </div>
          <div class="col-12 col-md-2">
            <select class="form-select" [(ngModel)]="sortOrderValue" (ngModelChange)="onSortOrderChangeClick()">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div class="col-12 col-md-3">
            <button
              type="button"
              class="btn btn-outline-secondary w-100"
              (click)="onResetFiltersClick()"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col">Challan No</th>
                <th scope="col">Date</th>
                <th scope="col">Company</th>
                <th scope="col">Buyer</th>
                <th scope="col">Product</th>
                <th scope="col" class="table-action-col-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (challan of challans(); track challan.id) {
                <tr>
                  <td class="fw-semibold">{{ challan.challanNo }}</td>
                  <td>{{ challan.date | date: 'dd MMM yyyy' }}</td>
                  <td>{{ getCompanyName(challan.companyId, challan.company) }}</td>
                  <td>{{ getBuyerName(challan.buyerId, challan.buyer) }}</td>
                  <td>{{ challan.productName }}</td>
                  <td class="d-flex flex-wrap gap-1">
                    <button type="button" class="btn btn-outline-primary btn-sm" (click)="onView.emit(challan.id)">View</button>
                    <button type="button" class="btn btn-outline-warning btn-sm" (click)="onEdit.emit(challan.id)">Edit</button>
                    <button type="button" class="btn btn-outline-danger btn-sm" (click)="onDelete.emit(challan)">Delete</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" (click)="onDownloadPdf.emit(challan.id)">PDF</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center text-body-secondary py-4">No challans found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Section -->
        <div class="d-flex align-items-center justify-content-between mt-4 pt-3 border-top">
          <div class="text-body-secondary small">
            Showing {{ (pageNumber() - 1) * pageSize() + 1 }} to {{ Math.min(pageNumber() * pageSize(), totalCount()) }} of {{ totalCount() }} entries
          </div>
          <div class="d-flex gap-2 align-items-center">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              (click)="onPreviousPageClick()"
              [disabled]="!hasPreviousPage()"
            >
              Previous
            </button>
            <div class="btn-group" role="group">
              @for (page of getPageNumbers(); track page) {
                <button
                  type="button"
                  class="btn"
                  [class.btn-primary]="page === pageNumber()"
                  [class.btn-outline-primary]="page !== pageNumber()"
                  (click)="onGotoPageClick(page)"
                >
                  {{ page }}
                </button>
              }
            </div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              (click)="onNextPageClick()"
              [disabled]="!hasNextPage()"
            >
              Next
            </button>
          </div>
          <div class="text-body-secondary small">
            Page {{ pageNumber() }} of {{ totalPages() }}
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallanListComponent {
  readonly challans = input.required<Challan[]>();
  readonly companies = input.required<Company[]>();
  readonly buyers = input.required<Buyer[]>();
  readonly pageNumber = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly hasNextPage = input.required<boolean>();
  readonly hasPreviousPage = input.required<boolean>();
  readonly search = input.required<string>();
  readonly sortBy = input.required<string>();
  readonly sortOrder = input.required<string>();

  readonly onView = output<number>();
  readonly onEdit = output<number>();
  readonly onDelete = output<Challan>();
  readonly onDownloadPdf = output<number>();
  readonly onSearch = output<string>();
  readonly onSortByChange = output<string>();
  readonly onSortOrderChange = output<string>();
  readonly onPageChange = output<number>();
  readonly onResetFilters = output<void>();

  searchValue = '';
  sortByValue = 'date';
  sortOrderValue = 'desc';
  Math = Math;

  onSearchChange(): void {
    this.onSearch.emit(this.searchValue);
  }

  onSortByChangeClick(): void {
    this.onSortByChange.emit(this.sortByValue);
  }

  onSortOrderChangeClick(): void {
    this.onSortOrderChange.emit(this.sortOrderValue);
  }

  onResetFiltersClick(): void {
    this.searchValue = '';
    this.sortByValue = 'date';
    this.sortOrderValue = 'desc';
    this.onResetFilters.emit();
  }

  onPreviousPageClick(): void {
    if (this.hasPreviousPage()) {
      this.onPageChange.emit(this.pageNumber() - 1);
    }
  }

  onNextPageClick(): void {
    if (this.hasNextPage()) {
      this.onPageChange.emit(this.pageNumber() + 1);
    }
  }

  onGotoPageClick(page: number): void {
    this.onPageChange.emit(page);
  }

  getPageNumbers(): number[] {
    const current = this.pageNumber();
    const total = this.totalPages();
    const range = 2; // pages to show on each side of current
    const pages: number[] = [];

    let start = Math.max(1, current - range);
    let end = Math.min(total, current + range);

    if (end - start < 2 * range) {
      if (start === 1) {
        end = Math.min(total, end + (2 * range - (end - start)));
      } else {
        start = Math.max(1, start - (2 * range - (end - start)));
      }
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total) {
      if (end < total - 1) {
        pages.push(-1); // -1 represents ellipsis
      }
      pages.push(total);
    }

    return pages;
  }

  getCompanyName(companyId: number, company?: Company): string {
    if (company) {
      return company.name;
    }
    return this.companies().find((item) => item.id === companyId)?.name ?? 'Unknown Company';
  }

  getBuyerName(buyerId: number, buyer?: Buyer): string {
    if (buyer) {
      return buyer.name;
    }
    return this.buyers().find((item) => item.id === buyerId)?.name ?? 'Unknown Buyer';
  }
}
