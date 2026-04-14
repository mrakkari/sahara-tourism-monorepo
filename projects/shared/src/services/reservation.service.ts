// shared/src/services/reservation.service.ts

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TourType } from '../models/tour-type.model';
import { Tour } from '../models/tour.model';
import { ExtraResponse } from '../models/extra.model';
import { ReservationRequest, ReservationResponse, BackendReservationStatus } from '../models/reservation-api.model';
import { UserResponse } from '../models/user.model';
import { DEFAULT_TOUR_IMAGE, TOUR_TYPE_IMAGES } from '../models/constants/images';
import { PaymentRequest, PaymentResponse } from '../models/transaction.model';
import { ProformaResponse } from '../models/proforma.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ─── Tour Types ───────────────────────────────────────────────
  getAllTourTypes(): Observable<TourType[]> {
    return this.http.get<TourType[]>(`${this.apiUrl}/tour-types`).pipe(
      map(list => list.map(tt => ({
        ...tt,
        image: TOUR_TYPE_IMAGES[tt.name] ?? DEFAULT_TOUR_IMAGE
      })))
    );
  }

  // ─── Tours ────────────────────────────────────────────────────
  getAllTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/tours`);
  }

  getActiveTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/tours/active`);
  }

  // ─── Extras ───────────────────────────────────────────────────
  getActiveExtras(): Observable<ExtraResponse[]> {
    return this.http.get<ExtraResponse[]>(`${this.apiUrl}/extras`).pipe(
      map(list => list.filter(e => e.isActive))
    );
  }

  // ─── Users ────────────────────────────────────────────────────
  getClientsAndPartenaires(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/auth/clients-partenaires`);
  }

  // ─── Reservations ─────────────────────────────────────────────
  createReservation(request: ReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.apiUrl}/reservations`, request);
  }

  getReservationById(reservationId: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.apiUrl}/reservations/${reservationId}`);
  }

  getMyReservations(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.apiUrl}/reservations/my-reservations`);
  }

  updateReservation(reservationId: string, request: any): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(
      `${this.apiUrl}/reservations/${reservationId}`, request
    );
  }

  cancelReservation(reservationId: string): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${this.apiUrl}/reservations/${reservationId}/status?status=CANCELLED`, {}
    );
  }

  // ─── Status actions ───────────────────────────────────────────
  confirmReservation(reservationId: string): Observable<ReservationResponse> {
    return this.updateStatus(reservationId, 'CONFIRMED');
  }

  rejectReservation(reservationId: string, reason?: string): Observable<ReservationResponse> {
    let url = `${this.apiUrl}/reservations/${reservationId}/status?status=REJECTED`;
    if (reason) url += `&rejectionReason=${encodeURIComponent(reason)}`;
    return this.http.patch<ReservationResponse>(url, {});
  }

  checkInReservation(reservationId: string): Observable<ReservationResponse> {
    return this.updateStatus(reservationId, 'CHECKED_IN');
  }

  completeReservation(reservationId: string): Observable<ReservationResponse> {
    return this.updateStatus(reservationId, 'COMPLETED');
  }

  private updateStatus(reservationId: string, status: BackendReservationStatus): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${this.apiUrl}/reservations/${reservationId}/status?status=${status}`, {}
    );
  }

  // ─── NEW — Payments ───────────────────────────────────────────
  // POST /api/reservations/{id}/payments
  recordPayment(reservationId: string, request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/reservations/${reservationId}/payments`, request
    );
  }

  // ─── NEW — Proformas ──────────────────────────────────────────
  // GET /api/invoices — all invoices (admin filters by type on frontend)
  getAllProformas(): Observable<ProformaResponse[]> {
    return this.http.get<ProformaResponse[]>(`${this.apiUrl}/invoices`).pipe(
      map(list => list.filter(i => i.invoiceType === 'PROFORMA'))
    );
  }

  getProformasByReservation(reservationId: string): Observable<ProformaResponse[]> {
    return this.http.get<ProformaResponse[]>(
      `${this.apiUrl}/invoices/reservation/${reservationId}`
    ).pipe(
      map(list => list.filter(i => i.invoiceType === 'PROFORMA'))
    );
  }
  getReservationsByStatus(status: BackendReservationStatus): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(
      `${this.apiUrl}/reservations/status/${status}`
    );
  }
}