import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Buyer,
  Challan,
  ChallanDto,
  Company,
  CreateBuyerRequest,
  CreateCompanyRequest
} from '../models/challan.models';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://swadeshchallanapi.bazarlagbebd.com/api';

  // COMPANY
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/company`);
  }

  addCompany(data: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/company`, data);
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

  deleteBuyer(id: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/buyer/delete/${id}`, null, { responseType: 'text' });
  }

  // CHALLAN
  getChallans(): Observable<Challan[]> {
    return this.http.get<Challan[]>(`${this.baseUrl}/challan`);
  }

  getChallanById(id: number): Observable<Challan> {
    return this.http.get<Challan>(`${this.baseUrl}/challan/${id}`);
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
}