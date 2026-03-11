import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { Reservation, Extra, Transaction, Notification, TourTypeSnapshot, ExtraCatalog } from '../models/reservation.model';
import { isToday, isTomorrow, isInDateRange } from '../utils/date-utils';
import { HttpClient } from '@angular/common/http';

// ── Status mapping ────────────────────────────────────────────
type BackendStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';
type FrontendStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'rejected' | 'completed';

const STATUS_MAP: Record<BackendStatus, FrontendStatus> = {
    PENDING:    'pending',
    CONFIRMED:  'confirmed',
    CHECKED_IN: 'checked_in',
    CANCELLED:  'cancelled',
    REJECTED:   'rejected',
    COMPLETED:  'completed',
};
// ─────────────────────────────────────────────────────────────

interface ReservationTourTypeResponse {
    reservationTourTypeId: string;
    name: string;
    description: string;
    duration: string;
    adultPrice: number;
    childPrice: number;
    numberOfAdults: number;
    numberOfChildren: number;
    totalPrice: number;
    numberOfNights: number;
}

interface ParticipantResponse {
    participantId: string;
    fullName: string;
    age: number;
    isAdult: boolean;
}

interface ReservationExtraResponse {
    reservationExtraId: string;
    reservationId: string;
    name: string;
    description: string;
    duration: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isActive: boolean;
}

interface ReservationResponse {
    reservationId: string;
    userId: string;
    userName: string;
    source: string;
    checkInDate: string;
    checkOutDate: string;
    groupName: string;
    groupLeaderName: string;
    numberOfAdults: number;
    numberOfChildren: number;
    status: BackendStatus;
    rejectionReason?: string;
    totalAmount: number;
    currency: string;
    promoCode?: string;
    demandeSpecial?: string;
    tourTypes: ReservationTourTypeResponse[];
    participants: ParticipantResponse[];
    extras: ReservationExtraResponse[];
    totalExtrasAmount: number;
    createdAt: string;
    deletedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly NOTIFS_KEY = 'sahara-camping-notifications';
    private readonly API_URL = 'http://localhost:8080/api/reservations';

    private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
    public reservations$ = this.reservationsSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadNotifications();
        this.fetchAllReservations();
    }
    createReservation(payload: Record<string, unknown>): Observable<Reservation> {
        return this.http.post<ReservationResponse>(this.API_URL, payload).pipe(
            map(dto => {
                const created = this.mapToReservation(dto);
                // Add to local cache immediately
                this.reservationsSubject.next([created, ...this.reservationsSubject.value]);
                return created;
            }),
            catchError(err => {
                console.error('Failed to create reservation:', err);
                throw err;
            })
        );
    }

    // ── Mapping ───────────────────────────────────────────────

    private mapToReservation(dto: ReservationResponse): Reservation {
        const adults   = dto.numberOfAdults  ?? 0;
        const children = dto.numberOfChildren ?? 0;

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

        const participants = (dto.participants ?? []).map(p => ({
            name:    p.fullName,
            age:     p.age,
            isAdult: p.isAdult,
        }));

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

        const primaryTour    = tourTypes[0];
        const grandTotal     = (dto.totalAmount ?? 0) + (dto.totalExtrasAmount ?? 0);
        const frontendStatus: Reservation['status'] = STATUS_MAP[dto.status] ?? 'pending';

        return {
            id:                dto.reservationId,
            reservationId:     dto.reservationId,
            partnerId:         dto.userId,
            partnerName:       dto.userName,
            userName:          dto.userName,
            groupName:         dto.groupName,
            groupLeaderName:   dto.groupLeaderName,
            numberOfPeople:    adults + children,
            adults,
            children,
            numberOfAdults:    adults,
            numberOfChildren:  children,
            checkInDate:       dto.checkInDate,
            checkOutDate:      dto.checkOutDate,
            status:            frontendStatus,
            rejectionReason:   dto.rejectionReason,
            promoCode:         dto.promoCode,
            demandeSpecial:    dto.demandeSpecial,
            currency:          dto.currency,
            totalAmount:       dto.totalAmount,
            totalExtrasAmount: dto.totalExtrasAmount,
            deletedAt:         dto.deletedAt ?? null,
            tourTypes,
            groupInfo: {
                participants,
                specialRequests:  dto.demandeSpecial ?? undefined,
                tourType:         primaryTour?.name,
                leaderName:       dto.groupLeaderName,
                groupLeaderName:  dto.groupLeaderName,
                groupName:        dto.groupName,
            },
            payment: {
                totalAmount:  grandTotal,
                paidAmount:   0,
                currency:     (dto.currency as 'TND' | 'EUR' | 'USD') ?? 'TND',
                paymentStatus: 'pending',
                transactions:  [],
            },
            extras,
            loyaltyPointsEarned: Math.floor(grandTotal * 0.1),
            createdAt:  dto.createdAt,
            updatedAt:  dto.createdAt,
        };
    }

    // ── Fetch ─────────────────────────────────────────────────

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

    // ── Fetch by status (for groups page) ────────────────────

    fetchByStatus(status: BackendStatus): Observable<Reservation[]> {
        return this.http.get<ReservationResponse[]>(`${this.API_URL}/status/${status}`).pipe(
            map(dtos => dtos.map(d => this.mapToReservation(d))),
            catchError(err => {
                console.error(`Failed to load reservations with status ${status}:`, err);
                return of([]);
            })
        );
    }

    // ── Status update ─────────────────────────────────────────

    updateStatus(id: string, status: BackendStatus, rejectionReason?: string): Observable<Reservation> {
        let params = `?status=${status}`;
        if (rejectionReason) params += `&rejectionReason=${encodeURIComponent(rejectionReason)}`;

        return this.http.patch<ReservationResponse>(`${this.API_URL}/${id}/status${params}`, {}).pipe(
            map(dto => {
                const updated = this.mapToReservation(dto);
                this.updateLocalCache(updated);
                return updated;
            }),
            catchError(err => {
                console.error('Failed to update status:', err);
                throw err;
            })
        );
    }

    confirmReservation(id: string): Observable<Reservation> {
        return this.updateStatus(id, 'CONFIRMED').pipe(
            tap(updated => this.addNotification({
                partnerId:     updated.partnerId ?? 'unknown',
                type:          'reservation_status',
                title:         'Reservation Confirmed',
                message:       `Reservation #${id.substring(0, 6)} confirmed.`,
                link:          `/group/${id}`,
                reservationId: id,
            }))
        );
    }

    rejectReservation(id: string, reason?: string): Observable<Reservation> {
        return this.updateStatus(id, 'REJECTED', reason).pipe(
            tap(updated => this.addNotification({
                partnerId:     updated.partnerId ?? 'unknown',
                type:          'reservation_status',
                title:         'Reservation Rejected',
                message:       `Reservation #${id.substring(0, 6)} rejected.`,
                link:          `/group/${id}`,
                reservationId: id,
            }))
        );
    }

    markAsArrived(id: string): Observable<Reservation> {
        return this.updateStatus(id, 'CHECKED_IN').pipe(
            tap(updated => this.addNotification({
                partnerId:     updated.partnerId ?? 'unknown',
                type:          'reservation_status',
                title:         'Group Checked In',
                message:       `Group checked in for reservation #${id.substring(0, 6)}.`,
                link:          `/group/${id}`,
                reservationId: id,
            }))
        );
    }

    checkOutReservation(id: string): Observable<Reservation> {
        return this.updateStatus(id, 'COMPLETED').pipe(
            tap(updated => this.addNotification({
                partnerId:     updated.partnerId ?? 'unknown',
                type:          'reservation_status',
                title:         'Check-out Completed',
                message:       `Reservation #${id.substring(0, 6)} completed.`,
                link:          `/group/${id}`,
                reservationId: id,
            }))
        );
    }

    // ── Queries ───────────────────────────────────────────────

    getAllReservations(): Observable<Reservation[]> {
        return this.reservations$;
    }

    getReservationById(id: string): Reservation | undefined {
        return this.reservationsSubject.value.find(r => r.id === id);
    }

    getReservationsByStatus(status: Reservation['status']): Reservation[] {
        return this.reservationsSubject.value.filter(r => r.status === status);
    }

    getReservationsForToday(): Reservation[] {
        return this.reservationsSubject.value.filter(r => isToday(r.checkInDate));
    }

    getReservationsForTomorrow(): Reservation[] {
        return this.reservationsSubject.value.filter(r => isTomorrow(r.checkInDate));
    }

    getReservationsByDateRange(start?: Date, end?: Date): Reservation[] {
        return this.reservationsSubject.value.filter(r => isInDateRange(r.checkInDate, start, end));
    }

    // ── Local cache ───────────────────────────────────────────

    private updateLocalCache(updated: Reservation): void {
        const list = this.reservationsSubject.value;
        const idx  = list.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
            const next = [...list];
            next[idx]  = updated;
            this.reservationsSubject.next(next);
        }
    }

    // ── Extras & Payments (local only until backend ready) ────

    addExtra(reservationId: string, extra: Omit<Extra, 'id'>): void {
        const list  = this.reservationsSubject.value;
        const index = list.findIndex(r => r.id === reservationId);
        if (index === -1) return;

        const res        = list[index];
        const newExtra: Extra = { ...extra, id: this.generateId() };
        const next       = [...list];
        next[index] = {
            ...res,
            extras:  [...res.extras, newExtra],
            payment: { ...res.payment, totalAmount: res.payment.totalAmount + extra.totalPrice }
        };
        this.reservationsSubject.next(next);
    }

    removeExtra(reservationId: string, extraId: string): void {
        const list  = this.reservationsSubject.value;
        const index = list.findIndex(r => r.id === reservationId);
        if (index === -1) return;

        const res         = list[index];
        const toRemove    = res.extras.find(e => e.id === extraId);
        if (!toRemove) return;

        const next        = [...list];
        next[index] = {
            ...res,
            extras:  res.extras.filter(e => e.id !== extraId),
            payment: { ...res.payment, totalAmount: res.payment.totalAmount - toRemove.totalPrice }
        };
        this.reservationsSubject.next(next);
    }

    addPayment(reservationId: string, transaction: Omit<Transaction, 'id'>): void {
        const list  = this.reservationsSubject.value;
        const index = list.findIndex(r => r.id === reservationId);
        if (index === -1) return;

        const res         = list[index];
        const newTxn: Transaction = { ...transaction, id: this.generateId() };
        const newPaid     = res.payment.paidAmount + transaction.amount;
        const payStatus   = newPaid >= res.payment.totalAmount ? 'completed'
                          : newPaid > 0                        ? 'partial' : 'pending';

        const next        = [...list];
        next[index] = {
            ...res,
            payment: {
                ...res.payment,
                paidAmount:    newPaid,
                paymentStatus: payStatus,
                transactions:  [...res.payment.transactions, newTxn],
            }
        };
        this.reservationsSubject.next(next);
    }

    // ── Notifications ─────────────────────────────────────────

    getNotifications(): Observable<Notification[]> { return this.notifications$; }

    getUnreadCount(partnerId?: string): number {
        return this.notificationsSubject.value
            .filter(n => !n.isRead && (!partnerId || n.partnerId === partnerId)).length;
    }

    markAsRead(id: string): void {
        this.saveNotifications(
            this.notificationsSubject.value.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    }

    markAllAsRead(partnerId?: string): void {
        this.saveNotifications(
            this.notificationsSubject.value.map(n =>
                (!partnerId || n.partnerId === partnerId) ? { ...n, isRead: true } : n
            )
        );
    }

    private addNotification(n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): void {
        this.saveNotifications([
            { ...n, id: this.generateId(), timestamp: new Date().toISOString(), isRead: false },
            ...this.notificationsSubject.value
        ]);
    }

    private loadNotifications(): void {
        const stored = localStorage.getItem(this.NOTIFS_KEY);
        if (stored) this.notificationsSubject.next(JSON.parse(stored));
    }

    private saveNotifications(notifications: Notification[]): void {
        localStorage.setItem(this.NOTIFS_KEY, JSON.stringify(notifications));
        this.notificationsSubject.next(notifications);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }


        // ── Extras Catalog ────────────────────────────────────────────

    fetchExtrasCatalog(): Observable<ExtraCatalog[]> {
        return this.http.get<ExtraCatalog[]>('http://localhost:8080/api/extras').pipe(
            catchError(err => {
                console.error('Failed to load extras catalog:', err);
                return of([]);
            })
        );
    }

    addExtraToReservation(reservationId: string, extraId: string, quantity: number): Observable<Reservation> {
        const body = { reservationId, extraId, quantity };
        return this.http.post<ReservationResponse>('http://localhost:8080/api/reservation-extras', body).pipe(
            map(dto => {
                const updated = this.mapToReservation(dto);
                this.updateLocalCache(updated);
                return updated;
            }),
            catchError(err => {
                console.error('Failed to add extra:', err);
                throw err;
            })
        );
    }



    deleteExtra(reservationExtraId: string): Observable<void> {
        return this.http.delete<void>(
            `http://localhost:8080/api/reservation-extras/${reservationExtraId}`
        ).pipe(
            catchError(err => {
                console.error('Failed to delete extra:', err);
                throw err;
            })
        );
    }
}