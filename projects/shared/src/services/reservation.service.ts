import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TourType } from '../models/tour-type.model';
import { Tour } from '../models/tour.model';
import { ExtraResponse } from '../models/extra.model';
import { ReservationRequest, ReservationResponse, BackendReservationStatus } from '../models/reservation-api.model';
import { UserResponse } from '../models/user.model';
import { DEFAULT_TOUR_IMAGE, TOUR_TYPE_IMAGES } from '../models/constants/images';

@Injectable({ providedIn: 'root' })
export class ReservationService {

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ─── Tour Types (Hébergement catalog) ────────────────────────
  getAllTourTypes(): Observable<TourType[]> {
    return this.http.get<TourType[]>(`${this.apiUrl}/tour-types`).pipe(
      map(list => list.map(tt => ({
        ...tt,
        image: TOUR_TYPE_IMAGES[tt.name] ?? DEFAULT_TOUR_IMAGE
      })))
    );
  }

  // ─── Tours (packaged trips catalog) ──────────────────────────
  getAllTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/tours`);
  }

  getActiveTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/tours/active`);
  }

  // ─── Extras catalog ───────────────────────────────────────────
  getActiveExtras(): Observable<ExtraResponse[]> {
    return this.http.get<ExtraResponse[]>(`${this.apiUrl}/extras`).pipe(
      map(list => list.filter(e => e.isActive))
    );
  }

  // ─── Users ────────────────────────────────────────────────────
  getClientsAndPartenaires(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/auth/clients-partenaires`);
  }

  // ─── Create Reservation ───────────────────────────────────────
  createReservation(request: ReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.apiUrl}/reservations`, request);
  }

  // ─── Get Reservation By Id ────────────────────────────────────
  getReservationById(reservationId: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.apiUrl}/reservations/${reservationId}`);
  }

  // ─── My Reservations (CLIENT / PARTENAIRE) ────────────────────
  getMyReservations(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.apiUrl}/reservations/my-reservations`);
  }

  // ─── Update Reservation (CLIENT / PARTENAIRE) ─────────────────
  updateReservation(reservationId: string, request: any): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(
      `${this.apiUrl}/reservations/${reservationId}`, request
    );
  }

  // ─── Cancel Reservation ───────────────────────────────────────
  cancelReservation(reservationId: string): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${this.apiUrl}/reservations/${reservationId}/status?status=CANCELLED`, {}
    );
  }

  // ─── Status Actions (ADMIN) ───────────────────────────────────
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
}