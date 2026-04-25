import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Buyer,
  Challan,
  ChallanDto,
  ChallanItem,
  ChallanItemUnit,
  Company,
  CreateBuyerRequest,
  CreateCompanyRequest,
  CreateProductRequest,
  PaginatedResponse,
  Product,
  ReferenceItem,
  Style,
  UpdateBuyerRequest,
  UpdateCompanyRequest,
  UpdateProductRequest
} from '../models/challan.models';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

type BackendPoNo = { value?: unknown; Value?: unknown } | string;
type BackendReferenceItem = Omit<ReferenceItem, 'packets'> & {
  packets?: unknown;
};

type BackendChallanItem = Omit<ChallanItem, 'unit' | 'referenceItems'> & {
  unit?: unknown;
  referenceItems?: BackendReferenceItem[];
};

type BackendStyle = Omit<Style, 'challanItems'> & {
  challanItems?: BackendChallanItem[];
};

type BackendChallan = Omit<Challan, 'poNos' | 'styles'> & {
  poNos?: BackendPoNo[];
  PONos?: BackendPoNo[];
  pONos?: BackendPoNo[];
  styles?: BackendStyle[];
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://swadeshchallanapi.bazarlagbebd.com/api';
  // private readonly baseUrl = 'https://localhost:7294/api';

  // COMPANY
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/company`);
  }

  addCompany(data: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/company`, data);
  }

  updateCompany(id: number, data: UpdateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/company/update/${id}`, data);
  }

  deleteCompany(id: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/company/delete/${id}`, null, { responseType: 'text' });
  }

  // BUYER
  getBuyers(): Observable<Buyer[]> {
    return this.http.get<Buyer[]>(`${this.baseUrl}/buyer`);
  }

  addBuyer(data: CreateBuyerRequest): Observable<Buyer> {
    return this.http.post<Buyer>(`${this.baseUrl}/buyer`, data);
  }

  updateBuyer(id: number, data: UpdateBuyerRequest): Observable<Buyer> {
    return this.http.post<Buyer>(`${this.baseUrl}/buyer/update/${id}`, data);
  }

  deleteBuyer(id: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/buyer/delete/${id}`, null, { responseType: 'text' });
  }

  // PRODUCT
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/product`);
  }

  addProduct(data: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/product`, data);
  }

  updateProduct(id: number, data: UpdateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/product/update/${id}`, data);
  }

  deleteProduct(id: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/product/delete/${id}`, null, { responseType: 'text' });
  }

  // CHALLAN
  getChallans(): Observable<Challan[]> {
    return this.http.get<BackendChallan[]>(`${this.baseUrl}/challan`).pipe(
      map((challans) => challans.map((challan) => this.normalizeChallan(challan)))
    );
  }

  getChallansPaginated(
    pageNumber: number = 1,
    pageSize: number = 10,
    search?: string,
    sortBy: string = 'date',
    sortOrder: string = 'desc',
    fromDate?: Date,
    toDate?: Date
  ): Observable<PaginatedResponse<Challan>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (search) {
      params = params.set('search', search);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString().split('T')[0]);
    }
    if (toDate) {
      params = params.set('toDate', toDate.toISOString().split('T')[0]);
    }

    return this.http.get<PaginatedResponse<BackendChallan>>(`${this.baseUrl}/challan`, { params }).pipe(
      map((response) => ({
        ...response,
        data: response.data.map((challan) => this.normalizeChallan(challan))
      }))
    );
  }

  getChallanById(id: number): Observable<Challan> {
    return this.http.get<BackendChallan>(`${this.baseUrl}/challan/${id}`).pipe(
      map((challan) => this.normalizeChallan(challan))
    );
  }

  createChallan(data: ChallanDto): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/challan`, data);
  }

  updateChallan(id: number, data: ChallanDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/challan/edit/${id}`, data);
  }

  deleteChallan(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/challan/delete/${id}`, null);
  }

  getChallanPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/challan/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  private normalizeChallan(challan: BackendChallan): Challan {
    return {
      ...challan,
      poNos: this.extractPoNumbers(challan),
      styles: (challan.styles ?? []).map((style) => ({
        ...style,
        challanItems: (style.challanItems ?? []).map((item) => ({
          ...item,
          unit: this.normalizeChallanItemUnit(item.unit),
          referenceItems: (item.referenceItems ?? []) as ReferenceItem[]
        }))
      }))
    };
  }

  private normalizeChallanItemUnit(unit: unknown): ChallanItemUnit {
    if (unit === ChallanItemUnit.Inch || unit === 'Inch' || unit === 0 || unit === '0') {
      return ChallanItemUnit.Inch;
    }

    if (unit === ChallanItemUnit.Cm || unit === 'Cm' || unit === 1 || unit === '1') {
      return ChallanItemUnit.Cm;
    }

    return ChallanItemUnit.Cm;
  }

  private extractPoNumbers(challan: BackendChallan): string[] | undefined {
    const rawPoNos = challan.poNos ?? challan.PONos ?? challan.pONos;
    if (!Array.isArray(rawPoNos)) {
      return undefined;
    }

    const values = rawPoNos
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        const candidate = item.value ?? item.Value;
        return typeof candidate === 'string' ? candidate : '';
      })
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return values.length > 0 ? values : undefined;
  }
}