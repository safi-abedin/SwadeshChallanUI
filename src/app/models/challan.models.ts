export interface Company {
  id: number;
  name: string;
  address: string;
}

export interface Buyer {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
}

export enum ChallanItemUnit {
  Inch = 0,
  Cm = 1
}

export interface ChallanItem {
  id?: number;
  description?: string;
  length: number;
  width: number;
  height?: number;
  unit?: ChallanItemUnit;
  ply: number;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
  referenceItems?: ReferenceItem[];
}

export interface ReferenceItem {
  id?: number;
  referenceDescription: string;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
}

export interface Style {
  id?: number;
  name: string;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
  challanItems?: ChallanItem[];
}

export interface Challan {
  id: number;
  challanNo: string;
  date: string;
  poNos?: string[];
  jobNo: string;
  productId: number;
  productName: string;
  styles: Style[];
  companyId: number;
  buyerId: number;
  company?: Company;
  buyer?: Buyer;
}

export interface CreateCompanyRequest {
  name: string;
  address: string;
}

export interface CreateBuyerRequest {
  name: string;
}

export interface UpdateBuyerRequest {
  name: string;
}

export interface CreateProductRequest {
  name: string;
}

export interface UpdateProductRequest {
  name: string;
}

export interface UpdateCompanyRequest {
  name: string;
  address: string;
}

export interface ChallanDto {
  companyId: number;
  buyerId: number;
  productId: number;
  date: string;
  poNos?: string[];
  jobNo: string;
  productName: string;
  styles: StyleDto[];
}

export interface StyleDto {
  name: string;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
  challanItems?: ChallanItemDto[];
}

export interface ChallanItemDto {
  description?: string;
  length: number;
  width: number;
  height?: number;
  unit?: ChallanItemUnit;
  ply: number;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
  referenceItems?: ReferenceItemDto[];
}

export interface ReferenceItemDto {
  referenceDescription: string;
  caseOrPacket?: number;
  packets?: string[];
  totalQuantity?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}