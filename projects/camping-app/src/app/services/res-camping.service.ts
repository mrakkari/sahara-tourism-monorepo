// camping-app/src/app/core/services/res-camping.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ── Shared DTOs (backend shape) ───────────────────────────────────
import {
  ReservationResponse,
  BackendReservationStatus,
} from '../../../../shared/src/models/reservation-api.model';

import {
  PaymentRequest,
  PaymentResponse,
  PaymentSummary,
} from '../../../../shared/src/models/transaction.model';

// ── Local mapped types (camping-app) ──────────────────────────────
import {
  Reservation,
  Extra,
  ExtraCatalog,
  Transaction,
  TourTypeSnapshot,
  TourSnapshot,
  FrontendStatus,
  GroupInfo,
  PaymentInfo,
} from '../models/reservation.model';

import { isToday, isTomorrow, isInDateRange } from '../utils/date-utils';

// ── Status mapping ────────────────────────────────────────────────
const STATUS_MAP: Record<BackendReservationStatus, FrontendStatus> = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  CHECKED_IN: 'checked_in',
  CANCELLED:  'cancelled',
  REJECTED:   'rejected',
  COMPLETED:  'completed',
};

// ── Method mapping (backend PaymentMethod → local) ────────────────
function mapPaymentMethod(method: string): Transaction['method'] {
  const map: Record<string, Transaction['method']> = {
    CASH:          'cash',
    CREDIT_CARD:   'credit_card',
    DEBIT_CARD:    'debit_card',
    BANK_TRANSFER: 'bank_transfer',
    ONLINE:        'onsite',
    CHEQUE:        'cheque',
  };
  return map[method] ?? 'onsite';
}

@Injectable({ providedIn: 'root' })
export class ResCampingService {

  private readonly API_URL  = 'http://localhost:8080/api/reservations';
  private readonly API_BASE = 'http://localhost:8080/api';

  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  public  reservations$       = this.reservationsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public  loading$       = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchAllReservations();
  }

  // ── Mapping ───────────────────────────────────────────────────

  private mapToReservation(dto: ReservationResponse): Reservation {
    const adults   = dto.numberOfAdults   ?? 0;
    const children = dto.numberOfChildren ?? 0;

    // ── Payment summary ───────────────────────────────────────
    const summary: PaymentSummary | undefined = dto.paymentSummary;

    const grandTotal = summary?.originalTotalAmount
      ?? (dto.totalAmount ?? 0) + (dto.totalExtrasAmount ?? 0);

    const paidAmount = summary?.totalPaid ?? 0;

    const paymentStatus: 'pending' | 'partial' | 'completed' =
      summary?.paymentStatus === 'PAID'           ? 'completed' :
      summary?.paymentStatus === 'PARTIALLY_PAID' ? 'partial'   : 'pending';

    // ── Transactions ──────────────────────────────────────────
    const transactions: Transaction[] = (dto.transactions ?? []).map(t => ({
      id:     t.transactionId,
      amount: t.amount,
      date:   t.transactionDate,
      method: mapPaymentMethod(t.paymentMethod),
      status: t.status === 'COMPLETED' ? 'completed' :
              t.status === 'FAILED'    ? 'failed'    : 'pending',
    }));

    // ── Extras ────────────────────────────────────────────────
    const extras: Extra[] = (dto.extras ?? [])
      .filter(e => e.isActive)
      .map(e => ({
        id:                 e.reservationExtraId,
        reservationExtraId: e.reservationExtraId,
        reservationId:      e.reservationId,
        type:               'other' as Extra['type'],
        name:               e.name,
        description:        e.description,
        duration:           e.duration,
        quantity:           e.quantity,
        unitPrice:          e.unitPrice,
        totalPrice:         e.totalPrice,
        isActive:           e.isActive,
      }));

    // ── Participants ──────────────────────────────────────────
    const participants = (dto.participants ?? []).map(p => ({
      name:    p.fullName,
      age:     p.age,
      isAdult: p.isAdult,
    }));

    // ── Tour types (HEBERGEMENT) ──────────────────────────────
    const tourTypes: TourTypeSnapshot[] = (dto.tourTypes ?? []).map(t => ({
      reservationTourTypeId: t.reservationTourTypeId,
      name:                  t.name,
      description:           t.description,
      duration:              t.duration,
      adultPrice:            t.adultPrice,
      childPrice:            t.childPrice,
      numberOfAdults:        t.numberOfAdults,
      numberOfChildren:      t.numberOfChildren,
      totalPrice:            t.totalPrice,
      numberOfNights:        t.numberOfNights ?? null,
    }));

    // ── Tours (TOURS type) ────────────────────────────────────
    const tours: TourSnapshot[] = (dto.tours ?? []).map(t => ({
      reservationTourId: t.reservationTourId,
      name:              t.name,
      description:       t.description,
      duration:          t.duration,
      adultPrice:        t.adultPrice,
      childPrice:        t.childPrice,
      numberOfAdults:    t.numberOfAdults,
      numberOfChildren:  t.numberOfChildren,
      departureDate:     t.departureDate,
      totalPrice:        t.totalPrice,
    }));

    const primaryTour    = tourTypes[0];
    const frontendStatus = STATUS_MAP[dto.status] ?? 'pending';

    const groupInfo: GroupInfo = {
      participants,
      specialRequests: dto.demandeSpecial ?? undefined,
      tourType:        primaryTour?.name,
      leaderName:      dto.groupLeaderName,
      groupLeaderName: dto.groupLeaderName,
      groupName:       dto.groupName,
    };

    const payment: PaymentInfo = {
      totalAmount:   grandTotal,
      paidAmount,
      currency:      (dto.currency as 'TND' | 'EUR' | 'USD') ?? 'TND',
      paymentStatus,
      transactions,
    };

    return {
      id:                dto.reservationId,
      reservationId:     dto.reservationId,
      partnerId:         dto.userId,
      partnerName:       dto.userName,
      userName:          dto.userName,
      source:            dto.source,
      groupName:         dto.groupName,
      groupLeaderName:   dto.groupLeaderName,
      numberOfPeople:    adults + children,
      adults,
      children,
      numberOfAdults:    adults,
      numberOfChildren:  children,
      reservationType:   dto.reservationType,
      checkInDate:       dto.checkInDate  ?? '',
      checkOutDate:      dto.checkOutDate ?? '',
      serviceDate:       dto.serviceDate,
      status:            frontendStatus,
      rejectionReason:   dto.rejectionReason,
      promoCode:         dto.promoCode,
      demandeSpecial:    dto.demandeSpecial,
      currency:          dto.currency,
      totalAmount:       dto.totalAmount,
      totalExtrasAmount: dto.totalExtrasAmount,
      deletedAt:         dto.deletedAt ?? null,
      tourTypes,
      tours,
      groupInfo,
      payment,
      extras,
      loyaltyPointsEarned: Math.floor(grandTotal * 0.1),
      createdAt:  dto.createdAt,
      updatedAt:  dto.createdAt,
    };
  }

  // ── Fetch all ─────────────────────────────────────────────────

  fetchAllReservations(): void {
    this.loadingSubject.next(true);
    this.http.get<ReservationResponse[]>(this.API_URL).pipe(
      tap(dtos => {
        this.reservationsSubject.next(dtos.map(d => this.mapToReservation(d)));
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        console.error('Failed to load reservations:', err);
        this.loadingSubject.next(false);
        return of([]);
      })
    ).subscribe();
  }

  fetchReservationById(id: string): Observable<Reservation> {
    return this.http.get<ReservationResponse>(`${this.API_URL}/${id}`).pipe(
      map(dto => this.mapToReservation(dto))
    );
  }

  // ── Fetch by status ───────────────────────────────────────────

  fetchByStatus(status: BackendReservationStatus): Observable<Reservation[]> {
    return this.http.get<ReservationResponse[]>(
      `${this.API_URL}/status/${status}`
    ).pipe(
      map(dtos => dtos.map(d => this.mapToReservation(d))),
      catchError(() => of([]))
    );
  }

  fetchConfirmed():    Observable<Reservation[]> { return this.fetchByStatus('CONFIRMED');  }
  fetchCheckedIn():    Observable<Reservation[]> { return this.fetchByStatus('CHECKED_IN'); }

  fetchConfirmedAndCheckedIn(): Observable<Reservation[]> {
    return this.http.get<ReservationResponse[]>(this.API_URL).pipe(
      map(dtos =>
        dtos
          .filter(d => d.status === 'CONFIRMED' || d.status === 'CHECKED_IN')
          .map(d => this.mapToReservation(d))
      ),
      catchError(() => of([]))
    );
  }

  // ── Queries from cache ────────────────────────────────────────

  getAllReservations(): Observable<Reservation[]> { return this.reservations$; }

  getReservationById(id: string): Reservation | undefined {
    return this.reservationsSubject.value.find(r => r.id === id);
  }

  getReservationsByStatus(status: FrontendStatus): Reservation[] {
    return this.reservationsSubject.value.filter(r => r.status === status);
  }

  getReservationsForToday():    Reservation[] {
    return this.reservationsSubject.value.filter(r => isToday(r.checkInDate));
  }

  getReservationsForTomorrow(): Reservation[] {
    return this.reservationsSubject.value.filter(r => isTomorrow(r.checkInDate));
  }

  getReservationsByDateRange(start?: Date, end?: Date): Reservation[] {
    return this.reservationsSubject.value.filter(r =>
      isInDateRange(r.checkInDate, start, end)
    );
  }

  // ── Status updates ────────────────────────────────────────────

  updateStatus(
    id: string,
    status: BackendReservationStatus,
    rejectionReason?: string
  ): Observable<Reservation> {
    let params = `?status=${status}`;
    if (rejectionReason) params += `&rejectionReason=${encodeURIComponent(rejectionReason)}`;

    return this.http.patch<ReservationResponse>(
      `${this.API_URL}/${id}/status${params}`, {}
    ).pipe(
      map(dto => {
        const updated = this.mapToReservation(dto);
        this.updateLocalCache(updated);
        return updated;
      }),
      catchError(err => { console.error('Failed to update status:', err); throw err; })
    );
  }

  confirmReservation(id: string):                    Observable<Reservation> { return this.updateStatus(id, 'CONFIRMED');         }
  rejectReservation(id: string, reason?: string):    Observable<Reservation> { return this.updateStatus(id, 'REJECTED', reason);  }
  markAsArrived(id: string):                         Observable<Reservation> { return this.updateStatus(id, 'CHECKED_IN');        }
  checkOutReservation(id: string):                   Observable<Reservation> { return this.updateStatus(id, 'COMPLETED');         }
  cancelReservation(id: string):                     Observable<Reservation> { return this.updateStatus(id, 'CANCELLED');         }

  // ── Payments ──────────────────────────────────────────────────

  recordPayment(reservationId: string, request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.API_URL}/${reservationId}/payments`, request
    ).pipe(
      tap(response => {
        const summary = response.paymentSummary;
        const list    = this.reservationsSubject.value;
        const index   = list.findIndex(r => r.id === reservationId);
        if (index === -1) return;

        const res     = list[index];
        const newPaid = summary?.totalPaid             ?? res.payment.paidAmount;
        const total   = summary?.originalTotalAmount   ?? res.payment.totalAmount;
        const status: PaymentInfo['paymentStatus'] =
          summary?.paymentStatus === 'PAID'           ? 'completed' :
          summary?.paymentStatus === 'PARTIALLY_PAID' ? 'partial'   : 'pending';

        const newTxn: Transaction = {
          id:     response.transactionId,
          amount: response.amount,
          date:   response.transactionDate,
          method: mapPaymentMethod(response.paymentMethod),
          status: 'completed',
        };

        const next    = [...list];
        next[index]   = {
          ...res,
          payment: {
            ...res.payment,
            paidAmount:    newPaid,
            totalAmount:   total,
            paymentStatus: status,
            transactions:  [...res.payment.transactions, newTxn],
          },
        };
        this.reservationsSubject.next(next);
      }),
      catchError(err => { console.error('Failed to record payment:', err); throw err; })
    );
  }

  // ── Extras ────────────────────────────────────────────────────

  fetchExtrasCatalog(): Observable<ExtraCatalog[]> {
    return this.http.get<ExtraCatalog[]>(`${this.API_BASE}/extras`).pipe(
      catchError(err => { console.error('Failed to load extras catalog:', err); return of([]); })
    );
  }

  addExtraToReservation(
    reservationId: string,
    extraId: string,
    quantity: number
  ): Observable<Reservation> {
    return this.http.post<ReservationResponse>(
      `${this.API_BASE}/reservation-extras`,
      { reservationId, extraId, quantity }
    ).pipe(
      map(dto => {
        const updated = this.mapToReservation(dto);
        this.updateLocalCache(updated);
        return updated;
      }),
      catchError(err => { console.error('Failed to add extra:', err); throw err; })
    );
  }

  deleteExtra(reservationExtraId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.API_BASE}/reservation-extras/${reservationExtraId}`
    ).pipe(
      catchError(err => { console.error('Failed to delete extra:', err); throw err; })
    );
  }

  // ── Local cache ───────────────────────────────────────────────

  updateLocalCache(updated: Reservation): void {
    const list = this.reservationsSubject.value;
    const idx  = list.findIndex(r => r.id === updated.id);
    if (idx !== -1) {
      const next = [...list];
      next[idx]  = updated;
      this.reservationsSubject.next(next);
    }
  }
  searchReservationsByName(name: string): Observable<Reservation[]> {
    return this.http.get<ReservationResponse[]>(
        `${this.API_URL}/search?name=${encodeURIComponent(name)}`
    ).pipe(
        map(dtos => dtos
        .filter(d => d.status === 'CONFIRMED' || d.status === 'CHECKED_IN')
        .map(d => this.mapToReservation(d))
        ),
        catchError(() => of([]))
    );
   }
}