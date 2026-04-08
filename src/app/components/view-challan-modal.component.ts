import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { Buyer, Challan, ChallanItem, Company, Style } from '../models/challan.models';

@Component({
  selector: 'app-view-challan-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    @if (isOpen() && viewingChallan(); as challan) {
      <div class="modal fade show d-block app-view-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="viewChallanModalLabel">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content border-0 shadow-lg view-modal-shell">
            <div class="modal-header challan-view-header d-flex justify-content-between align-items-start">
              <div class="d-flex align-items-center gap-3">
                <img ngSrc="/Logo.png" width="56" height="56" alt="Swadesh Packaging logo" class="brand-logo rounded">
                <div>
                  <div class="eyebrow">Challan Preview</div>
                  <h2 class="modal-title h5 mb-1" id="viewChallanModalLabel">{{ challan.challanNo }}</h2>
                  <p class="mb-0 small text-body-secondary">Professional view with grouped styles and sorted items</p>
                </div>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <button type="button" class="btn btn-outline-light btn-sm" (click)="onDownloadPdf.emit(challan.id)">Open PDF</button>
                <button type="button" class="btn-close btn-close-white" aria-label="Close" (click)="onClose.emit()"></button>
              </div>
            </div>
            <div class="modal-body p-4 p-lg-4">
              <div class="summary-grid mb-4">
                <div class="summary-card"><span class="label">Date</span><span class="value">{{ challan.date | date: 'dd MMM yyyy' }}</span></div>
                <div class="summary-card"><span class="label">PO Number</span><span class="value">{{ formatPoNumbers(challan.poNos) }}</span></div>
                <div class="summary-card"><span class="label">Company</span><span class="value">{{ getCompanyName(challan.companyId, challan.company) }}</span></div>
                <div class="summary-card"><span class="label">Buyer</span><span class="value">{{ getBuyerName(challan.buyerId, challan.buyer) }}</span></div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-12 col-lg-6">
                  <div class="detail-card h-100">
                    <div class="detail-label">Job No</div>
                    <div class="detail-value">{{ challan.jobNo }}</div>
                  </div>
                </div>
                <div class="col-12 col-lg-6">
                  <div class="detail-card h-100">
                    <div class="detail-label">Product</div>
                    <div class="detail-value">{{ challan.productName }}</div>
                  </div>
                </div>
              </div>

              @for (style of challan.styles; track trackByIndex($index); let styleIndex = $index) {
                <section class="style-card mb-4">
                  <div class="style-card__header">
                    <div>
                      <div class="style-title">Style {{ styleIndex + 1 }}: {{ style.name }}</div>
                      <div class="style-meta mt-2">
                        <span>Case/Pkt: {{ style.caseOrPacket ?? '-' }}</span>
                        <span>Total Qty: {{ style.totalQuantity ?? '-' }}</span>
                        <span>Items: {{ getSortedChallanItems(style).length }}</span>
                      </div>
                    </div>
                    @if (style.packets?.length) {
                      <div class="packet-stack">
                        <span class="packet-stack__label">Bundle Per Case/Pkt</span>
                        @for (line of style.packets; track trackByIndex($index)) {
                          <span class="packet-pill">{{ formatDebugValue(line) }}</span>
                        }
                      </div>
                    }
                  </div>

                  <div class="style-card__body">
                    @for (item of getSortedChallanItems(style); track trackByIndex($index); let itemIndex = $index) {
                      <article class="item-card">
                        <div class="item-card__header">
                          <div>
                            <div class="item-title">Item {{ itemIndex + 1 }}{{ item.description ? ' - ' + item.description : '' }}</div>
                            <div class="item-specs">{{ formatItemSpec(item) }}</div>
                          </div>
                          <div class="item-badge">Case/Pkt: {{ item.caseOrPacket ?? '-' }}</div>
                        </div>

                        <div class="item-card__meta">
                          <span>Total Qty: {{ item.totalQuantity ?? '-' }}</span>
                          @if (item.packets?.length) {
                            <span>Bundle values: {{ item.packets?.length ?? 0 }}</span>
                          }
                        </div>

                        @if (item.packets?.length) {
                          <div class="packet-stack packet-stack--compact mt-3">
                            <span class="packet-stack__label">Bundle Per Case/Pkt</span>
                            @for (line of item.packets; track trackByIndex($index)) {
                              <span class="packet-pill">{{ formatDebugValue(line) }}</span>
                            }
                          </div>
                        }

                        @if (item.referenceItems?.length) {
                          <div class="table-responsive mt-3">
                            <table class="table table-sm align-middle reference-table mb-0">
                              <thead>
                                <tr>
                                  <th>Reference Description</th>
                                  <th>Case/Pkt</th>
                                  <th>Total Quantity</th>
                                  <th>Bundle Per Case/Pkt</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (reference of item.referenceItems; track trackByIndex($index)) {
                                  <tr>
                                    <td>{{ reference.referenceDescription }}</td>
                                    <td>{{ reference.caseOrPacket ?? '-' }}</td>
                                    <td>{{ reference.totalQuantity ?? '-' }}</td>
                                    <td>
                                      @if (reference.packets?.length) {
                                        <div class="packet-list">
                                          @for (line of reference.packets; track trackByIndex($index)) {
                                            <span>{{ formatDebugValue(line) }}</span>
                                          }
                                        </div>
                                      } @else {
                                        -
                                      }
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        } @else {
                          <div class="empty-state mt-3">No reference items.</div>
                        }
                      </article>
                    } @empty {
                      <div class="empty-state">No challan items in this style.</div>
                    }
                  </div>
                </section>
              } @empty {
                <div class="empty-state">No styles available.</div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="onClose.emit()">Close</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    }
  `,
  styles: [`
    .app-view-modal {
      background: rgba(6, 24, 39, 0.55);
      backdrop-filter: blur(3px);
    }

    .view-modal-shell {
      border-radius: 1.25rem;
      overflow: hidden;
      background: linear-gradient(180deg, #ffffff 0%, #f7f9fb 100%);
    }

    .challan-view-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: linear-gradient(135deg, #0f172a 0%, #123b4f 100%);
      color: #fff;
    }

    .challan-view-header .text-body-secondary,
    .challan-view-header .modal-title {
      color: rgba(255, 255, 255, 0.92) !important;
    }

    .eyebrow {
      margin-bottom: 0.2rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(191, 219, 254, 0.85);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .summary-card,
    .detail-card,
    .style-card,
    .item-card {
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }

    .summary-card {
      padding: 0.9rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-height: 4.4rem;
    }

    .label,
    .detail-label,
    .packet-stack__label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
    }

    .value,
    .detail-value {
      color: #0f172a;
      font-weight: 700;
      word-break: break-word;
    }

    .detail-card {
      padding: 1rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .style-card {
      overflow: hidden;
    }

    .style-card__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }

    .style-title {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
    }

    .style-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 0.9rem;
      font-size: 0.88rem;
      color: #475569;
    }

    .style-meta span,
    .item-card__meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .packet-stack {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      align-items: flex-start;
      min-width: min(100%, 18rem);
    }

    .packet-stack--compact {
      margin-top: 0.25rem;
    }

    .packet-pill {
      display: inline-flex;
      width: fit-content;
      max-width: 100%;
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      background: #e8f1f8;
      color: #0f3d57;
      font-size: 0.82rem;
      font-weight: 600;
      word-break: break-word;
    }

    .style-card__body {
      padding: 0.9rem 1.1rem 1.1rem;
      display: grid;
      gap: 0.85rem;
    }

    .item-card {
      padding: 1rem;
      background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    }

    .item-card__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .item-title {
      font-size: 0.98rem;
      font-weight: 800;
      color: #0f172a;
    }

    .item-specs {
      margin-top: 0.25rem;
      font-size: 0.9rem;
      color: #475569;
      font-weight: 600;
    }

    .item-badge {
      padding: 0.38rem 0.7rem;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .item-card__meta {
      margin-top: 0.85rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      color: #64748b;
      font-size: 0.86rem;
    }

    .reference-table {
      border-color: rgba(15, 23, 42, 0.08);
      color: #0f172a;
    }

    .reference-table thead th {
      background: #f8fafc;
      color: #334155;
      font-size: 0.77rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }

    .reference-table tbody td {
      vertical-align: top;
      border-top: 1px solid rgba(15, 23, 42, 0.06);
    }

    .packet-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      color: #475569;
      font-size: 0.84rem;
    }

    .empty-state {
      padding: 1rem;
      border-radius: 0.9rem;
      border: 1px dashed rgba(100, 116, 139, 0.35);
      background: #f8fafc;
      color: #64748b;
      text-align: center;
      font-weight: 600;
    }

    @media (max-width: 992px) {
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .style-card__header,
      .item-card__header {
        flex-direction: column;
      }

      .packet-stack {
        min-width: 0;
      }
    }

    @media (max-width: 576px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .modal-body.p-4 {
        padding: 1rem !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewChallanModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly viewingChallan = input.required<Challan | null>();
  readonly companies = input.required<Company[]>();
  readonly buyers = input.required<Buyer[]>();

  readonly onClose = output<void>();
  readonly onDownloadPdf = output<number>();

  trackByIndex(index: number): number {
    return index;
  }

  getSortedChallanItems(style: Style): ChallanItem[] {
    return [...(style.challanItems ?? [])].sort((left, right) => this.compareChallanItems(left, right));
  }

  formatItemSpec(item: ChallanItem): string {
    return `${this.formatDimensions(item)} ${item.ply} ply`;
  }

  formatDimensions(item: ChallanItem): string {
    const dimensions = [item.length, item.width];

    if (item.height != null) {
      dimensions.push(item.height);
    }

    return `${dimensions.join(' X ')} Cm`;
  }

  private compareChallanItems(left: ChallanItem | undefined, right: ChallanItem | undefined): number {
    const leftHasHeight = left?.height != null;
    const rightHasHeight = right?.height != null;

    if (leftHasHeight !== rightHasHeight) {
      return leftHasHeight ? -1 : 1;
    }

    const leftPly = left?.ply ?? 0;
    const rightPly = right?.ply ?? 0;

    if (leftPly !== rightPly) {
      return rightPly - leftPly;
    }

    const leftHeight = left?.height ?? -1;
    const rightHeight = right?.height ?? -1;

    return rightHeight - leftHeight;
  }

  formatDebugValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value === 'object' && 'value' in value) {
      const packetValue = (value as { value?: unknown }).value;
      if (typeof packetValue === 'string' || typeof packetValue === 'number') {
        return String(packetValue);
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
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

  formatPoNumbers(poNos: string[] | undefined): string {
    return poNos && poNos.length > 0 ? poNos.join(', ') : '-';
  }
}
