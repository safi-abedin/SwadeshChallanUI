import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api';
import { AuthService } from './services/auth';
import {
  Buyer,
  Challan,
  ChallanDto,
  ChallanItem,
  ChallanItemDto,
  Company,
  CreateBuyerRequest,
  CreateCompanyRequest,
  ReferenceItem
} from './models/challan.models';
import { forkJoin } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { LoadingService } from './services/loading';
import { ToasterService } from './services/toaster';

type TabKey = 'challan' | 'masters' | 'reports';

type CompanyFormGroup = FormGroup<{
  name: FormControl<string>;
  address: FormControl<string>;
}>;

type BuyerFormGroup = FormGroup<{
  name: FormControl<string>;
}>;

type ChallanItemFormGroup = FormGroup<{
  description: FormControl<string | null>;
  length: FormControl<number>;
  width: FormControl<number>;
  height: FormControl<number | null>;
  ply: FormControl<number>;
  caseOrPacket: FormControl<number | null>;
  perCaseOrPacket: FormControl<number | null>;
  totalQuantity: FormControl<number>;
  referenceItems: FormArray<ReferenceItemFormGroup>;
}>;

type ReferenceItemFormGroup = FormGroup<{
  referenceDescription: FormControl<string>;
  caseOrPacket: FormControl<number>;
  perCaseOrPacket: FormControl<number>;
  totalQuantity: FormControl<number>;
}>;

type ChallanFormGroup = FormGroup<{
  companyId: FormControl<number>;
  buyerId: FormControl<number>;
  date: FormControl<string>;
  poNo: FormControl<string>;
  productName: FormControl<string>;
  sty: FormControl<string>;
  challanItems: FormArray<ChallanItemFormGroup>;
}>;

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CommonModule, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly toaster = inject(ToasterService);
  readonly currentUser = this.auth.currentUser;

  readonly companies = signal<Company[]>([]);
  readonly buyers = signal<Buyer[]>([]);
  readonly challans = signal<Challan[]>([]);
  readonly isSubmitting = signal(false);
  readonly isUpdating = signal(false);
  readonly challanNoPreview = signal<string>(this.generateChallanNo());
  readonly activeTab = signal<TabKey>('challan');
  readonly isLoading = this.loading.isLoading;
  readonly editingChallanId = signal<number | null>(null);
  readonly editingChallanNo = signal('');
  readonly isEditModalOpen = signal(false);
  readonly viewingChallan = signal<Challan | null>(null);
  readonly isViewModalOpen = signal(false);
  readonly deletingChallan = signal<Challan | null>(null);
  readonly isDeleteModalOpen = signal(false);
  readonly isDeleting = signal(false);

  readonly companyForm: CompanyFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.required, Validators.maxLength(250)])
  });

  readonly buyerForm: BuyerFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(100)])
  });

  readonly challanForm: ChallanFormGroup = this.fb.group({
    companyId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    buyerId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    date: this.fb.control('', Validators.required),
    poNo: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    productName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    sty: this.fb.control('', [Validators.maxLength(80)]),
    challanItems: this.fb.array<ChallanItemFormGroup>([])
  });

  readonly editChallanForm: ChallanFormGroup = this.fb.group({
    companyId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    buyerId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    date: this.fb.control('', Validators.required),
    poNo: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    productName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    sty: this.fb.control('', [Validators.maxLength(80)]),
    challanItems: this.fb.array<ChallanItemFormGroup>([])
  });

  readonly hasMasterData = computed(() => this.companies().length > 0 && this.buyers().length > 0);

  constructor() {
    this.addChallanItem();
    this.loadInitialData();
    // Set today's date as default for challan form
    const today = this.formatDateForInput(new Date().toISOString());
    this.challanForm.patchValue({ date: today });
  }

  get challanItems(): FormArray<ChallanItemFormGroup> {
    return this.challanForm.controls.challanItems;
  }

  get editChallanItems(): FormArray<ChallanItemFormGroup> {
    return this.editChallanForm.controls.challanItems;
  }

  loadInitialData(): void {
    forkJoin({
      companies: this.api.getCompanies(),
      buyers: this.api.getBuyers(),
      challans: this.api.getChallans()
    }).subscribe({
      next: ({ companies, buyers, challans }) => {
        this.companies.set(companies);
        this.buyers.set(buyers);
        this.challans.set(challans);
      },
      error: () => this.toaster.error('Load failed', 'Could not load data. Please verify backend is running.')
    });
  }

  setActiveTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  moveToNextField(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target) return;

    // Get current form element's parent form or container
    const form = target.closest('form');
    if (!form) return;

    // Get all focusable elements in the form
    const focusableElements = Array.from(
      form.querySelectorAll('input, select, textarea, button:not([disabled])')
    ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement)[];

    const currentIndex = focusableElements.indexOf(target as any);
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      const keyboardEvent = event as KeyboardEvent;
      keyboardEvent.preventDefault();
      focusableElements[currentIndex + 1].focus();
    }
  }

  addCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    const payload: CreateCompanyRequest = this.companyForm.getRawValue();
    this.api.addCompany(payload).subscribe({
      next: () => {
        this.companyForm.reset({ name: '', address: '' });
        this.refreshMasterData();
        this.toaster.success('Company added', 'Company created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add company right now.')
    });
  }

  deleteCompany(id: number): void {
    this.api.deleteCompany(id).subscribe({
      next: () => {
        this.refreshMasterData();
        this.toaster.info('Company removed', 'Company deleted successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to delete company.')
    });
  }

  addBuyer(): void {
    if (this.buyerForm.invalid) {
      this.buyerForm.markAllAsTouched();
      return;
    }

    const payload: CreateBuyerRequest = this.buyerForm.getRawValue();
    this.api.addBuyer(payload).subscribe({
      next: () => {
        this.buyerForm.reset({ name: '' });
        this.refreshMasterData();
        this.toaster.success('Buyer added', 'Buyer created successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to add buyer right now.')
    });
  }

  deleteBuyer(id: number): void {
    this.api.deleteBuyer(id).subscribe({
      next: () => {
        this.refreshMasterData();
        this.toaster.info('Buyer removed', 'Buyer deleted successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to delete buyer.')
    });
  }

  addChallanItem(): void {
    this.challanItems.push(this.createChallanItemGroup());
  }

  removeChallanItem(index: number): void {
    if (this.challanItems.length > 1) {
      this.challanItems.removeAt(index);
    }
  }

  referenceItemsAt(itemIndex: number): FormArray<ReferenceItemFormGroup> {
    return this.challanItems.at(itemIndex).controls.referenceItems;
  }

  editReferenceItemsAt(itemIndex: number): FormArray<ReferenceItemFormGroup> {
    return this.editChallanItems.at(itemIndex).controls.referenceItems;
  }

  addReferenceItem(itemIndex: number): void {
    const referenceItem = this.createReferenceItemGroup();
    this.referenceItemsAt(itemIndex).push(referenceItem);
  }

  removeReferenceItem(itemIndex: number, referenceIndex: number): void {
    const references = this.referenceItemsAt(itemIndex);
      references.removeAt(referenceIndex);
  }

  addEditChallanItem(): void {
    this.editChallanItems.push(this.createChallanItemGroup());
  }

  removeEditChallanItem(index: number): void {
    if (this.editChallanItems.length > 1) {
      this.editChallanItems.removeAt(index);
    }
  }

  addEditReferenceItem(itemIndex: number): void {
    const referenceItem = this.createReferenceItemGroup();
    this.editReferenceItemsAt(itemIndex).push(referenceItem);
  }

  removeEditReferenceItem(itemIndex: number, referenceIndex: number): void {
    const references = this.editReferenceItemsAt(itemIndex);
      references.removeAt(referenceIndex);
  }

  submitChallan(): void {
    if (this.challanForm.invalid || !this.hasMasterData()) {
      this.challanForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload: ChallanDto = this.mapFormPayload(this.challanForm);

    this.api.createChallan(payload).subscribe({
      next: () => {
        this.resetChallanForm();
        this.refreshChallans();
        this.toaster.success('Challan created', 'Challan created successfully.');
        this.activeTab.set('reports');
      },
      error: () => this.toaster.error('Action failed', 'Unable to create challan. Please try again.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

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
        this.populateEditForm(challan);
        this.isEditModalOpen.set(true);
      },
      error: () => this.toaster.error('Action failed', 'Unable to load challan for edit.')
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

  confirmDeleteChallan(): void {
    const challan = this.deletingChallan();
    if (!challan) {
      return;
    }

    this.isDeleting.set(true);
    this.api.deleteChallan(challan.id).subscribe({
      next: () => {
        if (this.editingChallanId() === challan.id) {
          this.closeEditModal();
        }
        if (this.viewingChallan()?.id === challan.id) {
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

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingChallanId.set(null);
    this.editingChallanNo.set('');
    this.editChallanItems.clear();
    this.addEditChallanItem();
  }

  submitEditChallan(): void {
    if (this.editChallanForm.invalid || this.editingChallanId() === null) {
      this.editChallanForm.markAllAsTouched();
      return;
    }

    this.isUpdating.set(true);
    const payload: ChallanDto = this.mapFormPayload(this.editChallanForm);

    this.api.updateChallan(this.editingChallanId()!, payload).subscribe({
      next: () => {
        this.refreshChallans();
        this.closeEditModal();
        this.toaster.success('Challan updated', 'Challan updated successfully.');
      },
      error: () => this.toaster.error('Action failed', 'Unable to update challan. Please try again.'),
      complete: () => this.isUpdating.set(false)
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

  companyName(companyId: number, company?: Company): string {
    if (company) {
      return company.name;
    }
    return this.companies().find((item) => item.id === companyId)?.name ?? 'Unknown Company';
  }

  buyerName(buyerId: number, buyer?: Buyer): string {
    if (buyer) {
      return buyer.name;
    }
    return this.buyers().find((item) => item.id === buyerId)?.name ?? 'Unknown Buyer';
  }

  trackByIndex(index: number): number {
    return index;
  }

  private refreshMasterData(): void {
    forkJoin({
      companies: this.api.getCompanies(),
      buyers: this.api.getBuyers()
    }).subscribe({
      next: ({ companies, buyers }) => {
        this.companies.set(companies);
        this.buyers.set(buyers);
      }
    });
  }

  private refreshChallans(): void {
    this.api.getChallans().subscribe({
      next: (challans) => this.challans.set(challans)
    });
  }

  private mapFormPayload(form: ChallanFormGroup): ChallanDto {
    const value = form.getRawValue();
    const challanItems: ChallanItemDto[] = value.challanItems.map((item) => ({
      description: item.description ?? undefined,
      length: item.length,
      width: item.width,
      height: item.height ?? undefined,
      ply: item.ply,
      caseOrPacket: item.caseOrPacket ?? undefined,
      perCaseOrPacket: item.perCaseOrPacket ?? undefined,
      totalQuantity: item.totalQuantity ?? undefined,
      referenceItems: item.referenceItems && item.referenceItems.length > 0 
        ? item.referenceItems.map((reference) => ({
            referenceDescription: reference.referenceDescription,
            caseOrPacket: reference.caseOrPacket,
            perCaseOrPacket: reference.perCaseOrPacket,
            totalQuantity: reference.totalQuantity
          }))
        : undefined
    }));

    return {
      companyId: value.companyId,
      buyerId: value.buyerId,
      date: value.date,
      poNo: value.poNo,
      productName: value.productName,
      sty: value.sty,
      challanItems
    };
  }

  private resetChallanForm(): void {
    this.challanForm.reset({
      companyId: 0,
      buyerId: 0,
      date: '',
      poNo: '',
      productName: '',
      sty: ''
    });

    this.challanItems.clear();
    this.addChallanItem();
    this.challanNoPreview.set(this.generateChallanNo());
  }

  private populateEditForm(challan: Challan): void {
    this.editChallanForm.reset({
      companyId: challan.companyId,
      buyerId: challan.buyerId,
      date: this.formatDateForInput(challan.date),
      poNo: challan.poNo,
      productName: challan.productName,
      sty: challan.sty ?? ''
    });

    this.editChallanItems.clear();
    for (const item of challan.challanItems) {
      this.editChallanItems.push(this.createChallanItemGroup(item));
    }

    if (this.editChallanItems.length === 0) {
      this.addEditChallanItem();
    }

    this.editingChallanId.set(challan.id);
    this.editingChallanNo.set(challan.challanNo);
  }

  private createChallanItemGroup(item?: ChallanItem): ChallanItemFormGroup {
    const referenceGroups = this.fb.array<ReferenceItemFormGroup>([]);

    // Only add reference items if they exist in the item being edited
    if (item?.referenceItems && item.referenceItems.length > 0) {
      for (const reference of item.referenceItems) {
        referenceGroups.push(this.createReferenceItemGroup(reference));
      }
    }
    // Don't add initial empty reference item - user will add if needed

    // Setup listener for ChallanItem totalQuantity auto-calculation
    const caseControl = this.fb.control(item?.caseOrPacket ?? null, [Validators.min(0)]);
    const perCaseControl = this.fb.control(item?.perCaseOrPacket ?? null, [Validators.min(0)]);
    const totalControl = this.fb.control(item?.totalQuantity ?? 0, [Validators.required, Validators.min(0)]);

    const updateChallanItemTotal = () => {
      const caseValue = caseControl.value ?? 0;
      const perCaseValue = perCaseControl.value ?? 0;
      const total = (caseValue && perCaseValue) ? (caseValue * perCaseValue) : 0;
      totalControl.setValue(total, { emitEvent: false });
    };

    // Subscribe to changes for auto-calculation
    caseControl.valueChanges.subscribe(() => updateChallanItemTotal());
    perCaseControl.valueChanges.subscribe(() => updateChallanItemTotal());

    // Calculate on initial load
    updateChallanItemTotal();

    return this.fb.group({
      description: this.fb.control(item?.description ?? null, [Validators.maxLength(200)]),
      length: this.fb.control(item?.length ?? 0, [Validators.required, Validators.min(0)]),
      width: this.fb.control(item?.width ?? 0, [Validators.required, Validators.min(0)]),
      height: this.fb.control(item?.height ?? null, [Validators.min(0)]),
      ply: this.fb.control(item?.ply ?? 1, [Validators.required, Validators.min(1)]),
      caseOrPacket: caseControl,
      perCaseOrPacket: perCaseControl,
      totalQuantity: totalControl,
      referenceItems: referenceGroups
    });
  }

  private createReferenceItemGroup(reference?: ReferenceItem): ReferenceItemFormGroup {
      const refDescControl = this.fb.control(reference?.referenceDescription ?? '', [Validators.required, Validators.maxLength(200)]);
      const caseControl = this.fb.control(reference?.caseOrPacket ?? 0, [Validators.required, Validators.min(1)]);
      const perCaseControl = this.fb.control(reference?.perCaseOrPacket ?? 0, [Validators.required, Validators.min(1)]);
      const totalControl = this.fb.control(reference?.totalQuantity ?? 0, [Validators.required, Validators.min(0)]);

      const updateTotal = () => {
        const caseValue = caseControl.value ?? 0;
        const perCaseValue = perCaseControl.value ?? 0;
        const total = (caseValue * perCaseValue) || 0;
        totalControl.setValue(total, { emitEvent: false });
      };

      caseControl.valueChanges.subscribe(() => updateTotal());
      perCaseControl.valueChanges.subscribe(() => updateTotal());

      // Calculate on initial load if values exist
      updateTotal();
    return this.fb.group({
      referenceDescription: refDescControl,
      caseOrPacket: caseControl,
      perCaseOrPacket: perCaseControl,
      totalQuantity: totalControl
    });
  }


  private formatDateForInput(value: string): string {
    if (!value) {
      return '';
    }

    if (value.includes('T')) {
      return value.split('T')[0];
    }

    return value;
  }

  private generateChallanNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const hours = `${now.getHours()}`.padStart(2, '0');
    const minutes = `${now.getMinutes()}`.padStart(2, '0');
    const seconds = `${now.getSeconds()}`.padStart(2, '0');
    return `CH-${year}${month}${day}-${hours}${minutes}${seconds}`;
  }
}