import { Component, ChangeDetectionStrategy, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Challan, Company, Buyer, ChallanDto, StyleDto, ChallanItemDto, Style, ChallanItem, ReferenceItem, Product, ChallanItemUnit } from '../models/challan.models';

type ChallanItemFormGroup = FormGroup<{
  description: FormControl<string | null>;
  length: FormControl<number>;
  width: FormControl<number>;
  height: FormControl<number | null>;
  unit: FormControl<ChallanItemUnit>;
  ply: FormControl<number>;
  caseOrPacket: FormControl<number | null>;
  totalQuantity: FormControl<number | null>;
  referenceItems: FormArray<ReferenceItemFormGroup>;
}>;

type ReferenceItemFormGroup = FormGroup<{
  referenceDescription: FormControl<string>;
  caseOrPacket: FormControl<number | null>;
  totalQuantity: FormControl<number | null>;
}>;

type StyleFormGroup = FormGroup<{
  name: FormControl<string>;
  caseOrPacket: FormControl<number | null>;
  totalQuantity: FormControl<number | null>;
  challanItems: FormArray<ChallanItemFormGroup>;
}>;

type ChallanFormGroup = FormGroup<{
  companyId: FormControl<number>;
  buyerId: FormControl<number>;
  productId: FormControl<number>;
  date: FormControl<string>;
  poNos: FormArray<FormControl<string>>;
  jobNo: FormControl<string>;
  productName: FormControl<string>;
  styles: FormArray<StyleFormGroup>;
}>;

@Component({
  selector: 'app-edit-challan-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    @if (isOpen() && editingChallanId() !== null) {
      <div class="modal fade show d-block app-edit-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="editChallanModalLabel">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content challan-edit-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title h5 mb-0" id="editChallanModalLabel">Update Challan</h2>
                <p class="text-body-secondary mb-0 small">{{ editingChallanNo() }}</p>
              </div>
              <button type="button" class="btn-close" aria-label="Close" (click)="onClose.emit()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="editChallanForm" class="vstack gap-4 challan-form-stack edit-form-stack" novalidate>
                <div class="row g-3">
                  <div class="col-12 col-md-6"><label class="form-label">Challan No</label><input type="text" class="form-control" [value]="editingChallanNo()" readonly></div>
                  <div class="col-12 col-md-6"><label class="form-label">Company <span class="text-danger">*</span></label><select formControlName="companyId" class="form-select" [class.is-invalid]="showError(editChallanForm.controls.companyId)"><option [ngValue]="0">Select Company</option>@for (company of companies(); track company.id) {<option [ngValue]="company.id">{{ company.name }} - {{ company.address }}</option>}</select></div>
                  <div class="col-12 col-md-6"><label class="form-label">Buyer <span class="text-danger">*</span></label><select formControlName="buyerId" class="form-select" [class.is-invalid]="showError(editChallanForm.controls.buyerId)"><option [ngValue]="0">Select Buyer</option>@for (buyer of buyers(); track buyer.id) {<option [ngValue]="buyer.id">{{ buyer.name }}</option>}</select></div>
                  <div class="col-12 col-md-3"><label class="form-label">Date <span class="text-danger">*</span></label><input type="date" class="form-control" formControlName="date" [class.is-invalid]="showError(editChallanForm.controls.date)"></div>
                  <div class="col-12 col-md-3"><label class="form-label">Job No <span class="text-danger">*</span></label><input type="text" class="form-control" formControlName="jobNo" [class.is-invalid]="showError(editChallanForm.controls.jobNo)"></div>
                  <div class="col-12 col-md-3"><label class="form-label">Product Name <span class="text-danger">*</span></label><select formControlName="productId" class="form-select" [class.is-invalid]="showError(editChallanForm.controls.productId)" (change)="onProductSelected()"><option [ngValue]="0">Select Product</option>@for (product of products(); track product.id) {<option [ngValue]="product.id">{{ product.name }}</option>}</select></div>
                  <div class="col-12 col-md-6" formArrayName="poNos">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">PO Number(s)</label>
                      <button type="button" class="btn btn-outline-primary btn-sm" (click)="addPoNo()">Add PO</button>
                    </div>
                    <div class="vstack gap-2">
                      @for (poControl of editPoNumbers.controls; track trackByIndex($index); let poIndex = $index) {
                        <div class="d-flex gap-2 align-items-start">
                          <input type="text" class="form-control" [formControlName]="poIndex" [placeholder]="'PO ' + (poIndex + 1)" [class.is-invalid]="showError(poControl)">
                          <button type="button" class="btn btn-outline-danger btn-sm" (click)="removePoNo(poIndex)" [disabled]="editPoNumbers.length === 1">Remove</button>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <div formArrayName="styles" class="vstack gap-3">
                  <div class="d-flex align-items-center justify-content-between">
                    <h3 class="h6 mb-0">Styles</h3>
                    <button type="button" class="btn btn-outline-primary btn-sm" (click)="addStyle()">Add Style</button>
                  </div>

                  @for (styleGroup of editStyles.controls; track trackByIndex($index); let styleIndex = $index) {
                    <div class="border rounded p-3 bg-body-tertiary style-panel" [formGroupName]="styleIndex">
                      <div class="d-flex justify-content-between mb-2">
                        <h4 class="h6 mb-0">Style {{ styleIndex + 1 }}</h4>
                        <button type="button" class="btn btn-outline-danger btn-sm" (click)="removeStyle(styleIndex)" [disabled]="editStyles.length === 1">Remove Style</button>
                      </div>

                      <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4">
                          <label class="form-label">Style Name <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" formControlName="name" [class.is-invalid]="showError(styleGroup.controls.name)">
                        </div>
                        <div class="col-6 col-md-2">
                          <label class="form-label">Case/Pkt</label>
                          <input type="number" class="form-control" formControlName="caseOrPacket">
                        </div>
                        <div class="col-6 col-md-2">
                          <label class="form-label">Total Quantity</label>
                          <input type="number" class="form-control" formControlName="totalQuantity">
                        </div>
                        <div class="col-12 col-md-4">
                          <label class="form-label">Bundle Per Case/Pkt (Auto)</label>
                          <div class="small border rounded p-2 bg-light">
                            @for (line of perCaseLines(styleGroup.controls.caseOrPacket.value, styleGroup.controls.totalQuantity.value); track trackByIndex($index)) {
                              <div>{{ line }}</div>
                            } @empty {
                              <div class="text-body-secondary">Auto-generated after entering Case/Pkt and Total Quantity.</div>
                            }
                          </div>
                        </div>
                      </div>

                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <h5 class="h6 mb-0">Challan Items</h5>
                        <button type="button" class="btn btn-outline-primary btn-sm" (click)="addChallanItem(styleIndex)">Add Item</button>
                      </div>

                      <div [formArrayName]="'challanItems'" class="vstack gap-3">
                        @if (editStyleItemsAt(styleIndex).length > 0) {
                          @for (itemGroup of editStyleItemsAt(styleIndex).controls; track trackByIndex($index); let itemIndex = $index) {
                            <div class="border rounded p-3 bg-body item-panel" [formGroupName]="itemIndex">
                              <div class="d-flex justify-content-between mb-2">
                                <h6 class="mb-0">Item {{ itemIndex + 1 }}</h6>
                                <button type="button" class="btn btn-outline-danger btn-sm" (click)="removeChallanItem(styleIndex, itemIndex)">Remove Item</button>
                              </div>

                              <div class="row g-3">
                                <div class="col-12 col-lg-4"><label class="form-label">Description</label><input type="text" class="form-control" formControlName="description"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Length <span class="text-danger">*</span></label><input type="number" class="form-control" formControlName="length" [class.is-invalid]="showError(itemGroup.controls.length)"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Width <span class="text-danger">*</span></label><input type="number" class="form-control" formControlName="width" [class.is-invalid]="showError(itemGroup.controls.width)"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Height</label><input type="number" class="form-control" formControlName="height"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Unit</label><select class="form-select" formControlName="unit"><option [ngValue]="challanItemUnit.Cm">Cm</option><option [ngValue]="challanItemUnit.Inch">Inch</option></select></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Ply <span class="text-danger">*</span></label><input type="number" class="form-control" formControlName="ply" [class.is-invalid]="showError(itemGroup.controls.ply)"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Case/Pkt</label><input type="number" class="form-control" formControlName="caseOrPacket"></div>
                                <div class="col-6 col-lg-2"><label class="form-label">Total Quantity</label><input type="number" class="form-control" formControlName="totalQuantity"></div>
                                <div class="col-12 col-lg-4">
                                  <label class="form-label">Bundle Per Case/Pkt (Auto)</label>
                                  <div class="small border rounded p-2 bg-light">
                                    @for (line of perCaseLines(itemGroup.controls.caseOrPacket.value, itemGroup.controls.totalQuantity.value); track trackByIndex($index)) {
                                      <div>{{ line }}</div>
                                    } @empty {
                                      <div class="text-body-secondary">Auto-generated after entering Case/Pkt and Total Quantity.</div>
                                    }
                                  </div>
                                </div>
                              </div>

                              <div class="d-flex align-items-center justify-content-between mt-4 mb-2">
                                <h6 class="mb-0">Reference Items</h6>
                                <button type="button" class="btn btn-outline-primary btn-sm" (click)="addReferenceItem(styleIndex, itemIndex)">Add Reference</button>
                              </div>

                              @if (editReferenceItemsAt(styleIndex, itemIndex).length > 0) {
                                <div class="table-responsive" [formArrayName]="'referenceItems'">
                                  <table class="table table-bordered align-middle mb-0 bg-body reference-table">
                                    <thead class="table-light">
                                      <tr>
                                        <th>Reference Description <span class="text-danger">*</span></th>
                                        <th>Case/Pkt</th>
                                        <th>Total Quantity</th>
                                        <th>Bundle Per Case/Pkt (Auto)</th>
                                        <th class="table-action-col">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      @for (referenceGroup of editReferenceItemsAt(styleIndex, itemIndex).controls; track trackByIndex($index); let refIndex = $index) {
                                        <tr [formGroupName]="refIndex">
                                          <td><input type="text" class="form-control" formControlName="referenceDescription" [class.is-invalid]="showError(referenceGroup.controls.referenceDescription)"></td>
                                          <td><input type="number" class="form-control" formControlName="caseOrPacket"></td>
                                          <td><input type="number" class="form-control" formControlName="totalQuantity"></td>
                                          <td>
                                            @for (line of perCaseLines(referenceGroup.controls.caseOrPacket.value, referenceGroup.controls.totalQuantity.value); track trackByIndex($index)) {
                                              <div class="small">{{ line }}</div>
                                            } @empty {
                                              <div class="small text-body-secondary">-</div>
                                            }
                                          </td>
                                          <td class="text-center"><button type="button" class="btn btn-outline-danger btn-sm" (click)="removeReferenceItem(styleIndex, itemIndex, refIndex)">Remove</button></td>
                                        </tr>
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              } @else {
                                <div class="text-body-secondary small">No reference items added yet.</div>
                              }
                            </div>
                          }
                        } @else {
                          <div class="border rounded p-3 bg-body text-body-secondary">No challan items added yet.</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </form>

              <!-- <details class="mt-4 border-top pt-3">
                <summary class="fw-semibold small text-uppercase text-body-secondary">Debug values</summary>
                <div class="row g-3 mt-2">
                  <div class="col-12 col-lg-6">
                    <div class="small text-body-secondary mb-1">Incoming challan payload</div>
                    <pre class="bg-body-tertiary border rounded p-3 small mb-0 overflow-auto">{{ challanToEdit() | json }}</pre>
                  </div>
                  <div class="col-12 col-lg-6">
                    <div class="small text-body-secondary mb-1">Current form value</div>
                    <pre class="bg-body-tertiary border rounded p-3 small mb-0 overflow-auto">{{ editChallanForm.getRawValue() | json }}</pre>
                  </div>
                </div>
              </details> -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="onClose.emit()">Cancel</button>
              <button type="button" class="btn btn-primary btn-gradient-primary" [disabled]="isUpdating()" (click)="submitEdit()">
                @if (isUpdating()) { Updating... } @else { Update Challan }
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditChallanModalComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly challanItemUnit = ChallanItemUnit;

  readonly isOpen = input.required<boolean>();
  readonly editingChallanId = input.required<number | null>();
  readonly editingChallanNo = input.required<string>();
  readonly challanToEdit = input.required<Challan | null>();
  readonly companies = input.required<Company[]>();
  readonly buyers = input.required<Buyer[]>();
  readonly products = input.required<Product[]>();
  readonly isUpdating = input.required<boolean>();

  readonly onClose = output<void>();
  readonly onSubmit = output<ChallanDto>();

  readonly submitAttempted = signal(false);

  readonly editChallanForm: ChallanFormGroup = this.fb.group({
    companyId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    buyerId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    productId: this.fb.control(0, [Validators.required, Validators.min(1)]),
    date: this.fb.control('', Validators.required),
    poNos: this.fb.array<FormControl<string>>([this.createPoNoControl()]),
    jobNo: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    productName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    styles: this.fb.array<StyleFormGroup>([])
  });

  constructor() {
    effect(() => {
      const challan = this.challanToEdit();
      if (challan) {
        this.populateForm(challan);
        console.log('[EditChallanModal] incoming challan', challan);
        console.log('[EditChallanModal] populated form value', this.editChallanForm.getRawValue());
      }
    });
  }

  get editStyles(): FormArray<StyleFormGroup> {
    return this.editChallanForm.controls.styles;
  }

  get editPoNumbers(): FormArray<FormControl<string>> {
    return this.editChallanForm.controls.poNos;
  }

  trackByIndex(index: number): number {
    return index;
  }

  showError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || this.submitAttempted());
  }

  editStyleItemsAt(styleIndex: number): FormArray<ChallanItemFormGroup> {
    return this.editStyles.at(styleIndex).controls.challanItems;
  }

  editReferenceItemsAt(styleIndex: number, itemIndex: number): FormArray<ReferenceItemFormGroup> {
    return this.editStyleItemsAt(styleIndex).at(itemIndex).controls.referenceItems;
  }

  perCaseLines(caseOrPacket: number | null | undefined, totalQuantity: number | null | undefined): string[] {
    return this.buildPerCaseLines(caseOrPacket ?? null, totalQuantity ?? null) ?? [];
  }

  submitEdit(): void {
    this.submitAttempted.set(true);
    this.onProductSelected();
    if (this.editChallanForm.invalid) {
      this.editChallanForm.markAllAsTouched();
      return;
    }
    this.onSubmit.emit(this.getFormPayload());
  }

  addStyle(): void {
    this.editStyles.push(this.createStyleGroup());
  }

  removeStyle(styleIndex: number): void {
    if (this.editStyles.length > 1) {
      this.editStyles.removeAt(styleIndex);
    }
  }

  addPoNo(): void {
    this.editPoNumbers.push(this.createPoNoControl());
  }

  removePoNo(index: number): void {
    if (this.editPoNumbers.length > 1) {
      this.editPoNumbers.removeAt(index);
    }
  }

  addChallanItem(styleIndex: number): void {
    this.editStyleItemsAt(styleIndex).push(this.createChallanItemGroup());
  }

  removeChallanItem(styleIndex: number, itemIndex: number): void {
    this.editStyleItemsAt(styleIndex).removeAt(itemIndex);
  }

  addReferenceItem(styleIndex: number, itemIndex: number): void {
    const referenceItem = this.createReferenceItemGroup();
    this.editReferenceItemsAt(styleIndex, itemIndex).push(referenceItem);
  }

  removeReferenceItem(styleIndex: number, itemIndex: number, referenceIndex: number): void {
    const references = this.editReferenceItemsAt(styleIndex, itemIndex);
    references.removeAt(referenceIndex);
  }

  populateForm(challan: Challan): void {
    this.editChallanForm.reset({
      companyId: challan.companyId,
      buyerId: challan.buyerId,
      productId: this.resolveProductIdForChallan(challan),
      date: this.formatDateForInput(challan.date),
      jobNo: challan.jobNo,
      productName: challan.productName,
    });

    this.editPoNumbers.clear();
    const poItems = challan.poNos && challan.poNos.length > 0 ? challan.poNos : [''];
    for (const po of poItems) {
      this.editPoNumbers.push(this.createPoNoControl(po));
    }

    this.editStyles.clear();
    for (const style of challan.styles) {
      this.editStyles.push(this.createStyleGroup(style));
    }

    if (this.editStyles.length === 0) {
      this.addStyle();
    }
  }

  getFormPayload(): ChallanDto {
    const value = this.editChallanForm.getRawValue();
    const selectedProductName = this.products().find((item) => item.id === value.productId)?.name ?? value.productName;
    const styleDtos: StyleDto[] = value.styles.map((style) => ({
      name: style.name,
      caseOrPacket: style.caseOrPacket ?? undefined,
      totalQuantity: style.totalQuantity ?? undefined,
      packets: this.buildPerCaseLines(style.caseOrPacket ?? null, style.totalQuantity ?? null),
      challanItems: style.challanItems.length > 0
        ? style.challanItems.map((item): ChallanItemDto => ({
            description: item.description ?? undefined,
            length: item.length,
            width: item.width,
            height: item.height ?? undefined,
          unit: item.unit,
            ply: item.ply,
            caseOrPacket: item.caseOrPacket ?? undefined,
            totalQuantity: item.totalQuantity ?? undefined,
            packets: this.buildPerCaseLines(item.caseOrPacket ?? null, item.totalQuantity ?? null),
            referenceItems: item.referenceItems.length > 0
              ? item.referenceItems.map((reference) => ({
                  referenceDescription: reference.referenceDescription,
                  caseOrPacket: reference.caseOrPacket ?? undefined,
                  totalQuantity: reference.totalQuantity ?? undefined,
                  packets: this.buildPerCaseLines(reference.caseOrPacket ?? null, reference.totalQuantity ?? null)
                }))
              : undefined
          }))
        : undefined
    }));

    return {
      companyId: value.companyId,
      buyerId: value.buyerId,
      productId: value.productId,
      date: value.date,
      poNos: this.normalizePoNumbers(value.poNos),
      jobNo: value.jobNo,
      productName: selectedProductName,
      styles: styleDtos
    };
  }

  onProductSelected(): void {
    const productId = this.editChallanForm.controls.productId.value;
    const productName = this.products().find((item) => item.id === productId)?.name ?? '';
    this.editChallanForm.controls.productName.setValue(productName);
  }

  private resolveProductIdForChallan(challan: Challan): number {
    if (challan.productId && challan.productId > 0) {
      return challan.productId;
    }

    const matched = this.products().find((item) => item.name.toLowerCase() === challan.productName.toLowerCase());
    return matched?.id ?? 0;
  }

  private createStyleGroup(style?: Style): StyleFormGroup {
    const itemGroups = this.fb.array<ChallanItemFormGroup>([]);

    if (style?.challanItems && style.challanItems.length > 0) {
      for (const item of style.challanItems) {
        itemGroups.push(this.createChallanItemGroup(item));
      }
    }

    return this.fb.group({
      name: this.fb.control(style?.name ?? '', [Validators.required, Validators.maxLength(80)]),
      caseOrPacket: this.fb.control(style?.caseOrPacket ?? null),
      totalQuantity: this.fb.control(style?.totalQuantity ?? null),
      challanItems: itemGroups
    });
  }

  private createChallanItemGroup(item?: ChallanItem): ChallanItemFormGroup {
    const referenceGroups = this.fb.array<ReferenceItemFormGroup>([]);

    if (item?.referenceItems && item.referenceItems.length > 0) {
      for (const reference of item.referenceItems) {
        referenceGroups.push(this.createReferenceItemGroup(reference));
      }
    }

    return this.fb.group({
      description: this.fb.control(item?.description ?? null, [Validators.maxLength(200)]),
      length: this.fb.control(item?.length ?? 0, [Validators.required, Validators.min(0.01)]),
      width: this.fb.control(item?.width ?? 0, [Validators.required, Validators.min(0.01)]),
      height: this.fb.control(item?.height ?? null, [Validators.min(0)]),
      unit: this.fb.control(item?.unit ?? ChallanItemUnit.Cm),
      ply: this.fb.control(item?.ply ?? 1, [Validators.required, Validators.min(1)]),
      caseOrPacket: this.fb.control(item?.caseOrPacket ?? null),
      totalQuantity: this.fb.control(item?.totalQuantity ?? null),
      referenceItems: referenceGroups
    });
  }

  private createReferenceItemGroup(reference?: ReferenceItem): ReferenceItemFormGroup {
    const refDescControl = this.fb.control(reference?.referenceDescription ?? '', [Validators.required, Validators.maxLength(200)]);
    return this.fb.group({
      referenceDescription: refDescControl,
      caseOrPacket: this.fb.control(reference?.caseOrPacket ?? null),
      totalQuantity: this.fb.control(reference?.totalQuantity ?? null)
    });
  }

  private buildPerCaseLines(caseOrPacket: number | null | undefined, totalQuantity: number | null | undefined): string[] | undefined {
    if (!caseOrPacket || !totalQuantity || caseOrPacket <= 0 || totalQuantity <= 0) {
      return undefined;
    }

    const full = Math.floor(totalQuantity / caseOrPacket);
    const remainder = totalQuantity % caseOrPacket;
    const lines: string[] = [];

    if (full > 0) {
      lines.push(`${full} X ${caseOrPacket}`);
    }

    if (remainder > 0) {
      lines.push(`1 X ${remainder}`);
    }

    return lines.length > 0 ? lines : undefined;
  }

  private createPoNoControl(value = ''): FormControl<string> {
    return this.fb.control(value, [Validators.maxLength(100)]);
  }

  private normalizePoNumbers(values: string[]): string[] | undefined {
    const poList = values.map((item) => item.trim()).filter((item) => item.length > 0);
    return poList.length > 0 ? poList : undefined;
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
}
