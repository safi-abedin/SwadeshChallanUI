export interface Company {
  id: number;
  name: string;
  address: string;
}

export interface Buyer {
  id: number;
  name: string;
}

export interface ChallanItem {
  id?: number;
  description?: string;
  length: number;
  width: number;
  height?: number;
  ply: number;
  caseOrPacket?: number;
  perCaseOrPacket?: number;
  totalQuantity?: number;
  referenceItems?: ReferenceItem[];
}

export interface ReferenceItem {
  id?: number;
  referenceDescription: string;
  caseOrPacket: number;
  perCaseOrPacket: number;
  totalQuantity: number;
}

export interface Challan {
  id: number;
  challanNo: string;
  date: string;
  poNo: string;
  productName: string;
  sty?: string;
  companyId: number;
  buyerId: number;
  company?: Company;
  buyer?: Buyer;
  challanItems: ChallanItem[];
}

export interface CreateCompanyRequest {
  name: string;
  address: string;
}

export interface CreateBuyerRequest {
  name: string;
}

export interface ChallanDto {
  companyId: number;
  buyerId: number;
  date: string;
  poNo: string;
  productName: string;
  sty?: string;
  challanItems: ChallanItemDto[];
}

export interface ChallanItemDto {
  description?: string;
  length: number;
  width: number;
  height?: number;
  ply: number;
  caseOrPacket?: number;
  perCaseOrPacket?: number;
  totalQuantity?: number;
  referenceItems?: ReferenceItemDto[];
}

export interface ReferenceItemDto {
  referenceDescription: string;
  caseOrPacket: number;
  perCaseOrPacket: number;
  totalQuantity: number;
}