// admin/src/app/core/services/invoice.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FactureResponse } from '../models/facture.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  private readonly API_URL = 'http://localhost:8080/api/invoices';

  constructor(private http: HttpClient) {}

  // ── Factures (STANDARD) ───────────────────────────────────────
  getAllFactures(): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(`${this.API_URL}/factures`);
  }

  getFacturesByReservation(reservationId: string): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(
      `${this.API_URL}/factures/reservation/${reservationId}`
    );
  }

  getFactureById(invoiceId: string): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.API_URL}/${invoiceId}`);
  }

  // ── Proformas (PROFORMA) ──────────────────────────────────────
  getAllProformas(): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(`${this.API_URL}`).pipe(
      map(list => list.filter(i => i.invoiceType === 'PROFORMA'))
    );
  }

  getProformasByReservation(reservationId: string): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(
      `${this.API_URL}/reservation/${reservationId}`
    ).pipe(
      map(list => list.filter(i => i.invoiceType === 'PROFORMA'))
    );
  }
}