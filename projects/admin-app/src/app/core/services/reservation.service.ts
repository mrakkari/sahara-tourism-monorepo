import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Reservation, Extra, Notification, TourTypeSnapshot } from '../models/reservation.model';
import { isToday, isTomorrow, isInDateRange } from '../../utils/date-utils';
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
    status: BackendStatus;  // ← use BackendStatus type
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
    private readonly NOTIFS_KEY = 'sahara-notifications';
    private readonly API_URL = 'http://localhost:8080/api/reservations';

    private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
    public reservations$ = this.reservationsSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    private errorSubject = new BehaviorSubject<string | null>(null);
    public error$ = this.errorSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadNotifications();
    }

    private loadNotifications(): void {
        const stored = localStorage.getItem(this.NOTIFS_KEY);
        if (stored) {
            this.notificationsSubject.next(JSON.parse(stored));
        }
    }

    private saveNotifications(notifications: Notification[]): void {
        localStorage.setItem(this.NOTIFS_KEY, JSON.stringify(notifications));
        this.notificationsSubject.next(notifications);
    }

    private mapToReservation(dto: ReservationResponse): Reservation {
        const adults   = dto.numberOfAdults  ?? 0;
        const children = dto.numberOfChildren ?? 0;

        const extras: Extra[] = (dto.extras ?? [])
            .filter(e => e.isActive)
            .map(e => ({
                reservationExtraId: e.reservationExtraId,
                reservationId:      e.reservationId,
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

        const grandTotal   = (dto.totalAmount ?? 0) + (dto.totalExtrasAmount ?? 0);
        const paidAmount   = 0;
        const paymentStatus: 'pending' | 'partial' | 'completed' =
            paidAmount <= 0         ? 'pending' :
            paidAmount < grandTotal ? 'partial' : 'completed';

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

        const primaryTour = tourTypes[0];
        const frontendStatus: Reservation['status'] = STATUS_MAP[dto.status] ?? 'pending';

        return {
            id:                dto.reservationId,
            reservationId:     dto.reservationId,
            partnerId:         dto.userId,
            partnerName:       dto.userName,
            userId:            dto.userId,
            userName:          dto.userName,
            source:            dto.source,
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
                specialRequests: dto.demandeSpecial ?? undefined,
                tourType:        primaryTour?.name,
                groupLeaderName: dto.groupLeaderName,
                groupName:       dto.groupName,
            },
            payment: {
                totalAmount:   grandTotal,
                paidAmount,
                currency:      (dto.currency as 'TND' | 'EUR' | 'USD') ?? 'TND',
                paymentStatus,
                transactions:  [],
            },
            extras,
            loyaltyPointsEarned: Math.floor(grandTotal * 0.1),
            createdAt:  dto.createdAt,
            updatedAt:  dto.createdAt,
        };
    }

    fetchAllReservations(): void {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        this.http.get<ReservationResponse[]>(this.API_URL).pipe(
            tap(dtos => {
                const reservations = dtos.map(dto => this.mapToReservation(dto));
                this.reservationsSubject.next(reservations);
                this.loadingSubject.next(false);
            }),
            catchError(err => {
                console.error('Failed to load reservations:', err);
                this.errorSubject.next('Failed to load reservations. Please try again.');
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

    updateReservation(id: string, updates: Partial<Reservation>): Observable<Reservation> {
        return this.http.patch<ReservationResponse>(`${this.API_URL}/${id}`, updates).pipe(
            map(dto => {
                const updated = this.mapToReservation(dto);
                this.updateLocalCache(updated);
                return updated;
            }),
            catchError(err => {
                console.error('Failed to update reservation:', err);
                throw err;
            })
        );
    }

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

    private updateLocalCache(updated: Reservation): void {
        const list = this.reservationsSubject.value;
        const idx  = list.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
            const next = [...list];
            next[idx]  = updated;
            this.reservationsSubject.next(next);
        }
    }

    // ── Status update via PATCH /{id}/status ─────────────────────
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
            tap(updated => {
                this.addNotification({
                    partnerId:     updated.partnerId ?? 'unknown',
                    type:          'reservation_status',
                    title:         'Reservation Confirmed',
                    message:       `Reservation #${id.substring(0, 6)} has been confirmed!`,
                    link:          '/my-reservations',
                    reservationId: id,
                });
            })
        );
    }

    rejectReservation(id: string, reason?: string): Observable<Reservation> {
        return this.updateStatus(id, 'REJECTED', reason).pipe(
            tap(updated => {
                this.addNotification({
                    partnerId:     updated.partnerId ?? 'unknown',
                    type:          'reservation_status',
                    title:         'Reservation Rejected',
                    message:       `Reservation #${id.substring(0, 6)} was rejected.`,
                    link:          '/my-reservations',
                    reservationId: id,
                });
            })
        );
    }

    checkInReservation(id: string): Observable<Reservation> {
        return this.updateStatus(id, 'CHECKED_IN').pipe(
            tap(updated => {
                this.addNotification({
                    partnerId:     updated.partnerId ?? 'unknown',
                    type:          'reservation_status',
                    title:         'Group Checked In',
                    message:       `Group checked in for reservation #${id.substring(0, 6)}.`,
                    link:          `/reservation/${id}`,
                    reservationId: id,
                });
            })
        );
    }

    completeReservation(id: string): Observable<Reservation> {
        return this.updateStatus(id, 'COMPLETED');
    }

    // ── Notifications ─────────────────────────────────────────

    getNotifications(): Observable<Notification[]> {
        return this.notifications$;
    }

    getUnreadCount(partnerId?: string): number {
        return this.notificationsSubject.value
            .filter(n => !n.isRead && (!partnerId || n.partnerId === partnerId))
            .length;
    }

    markAsRead(id: string): void {
        const notifications = this.notificationsSubject.value
            .map(n => n.id === id ? { ...n, isRead: true } : n);
        this.saveNotifications(notifications);
    }

    markAllAsRead(partnerId?: string): void {
        const notifications = this.notificationsSubject.value
            .map(n => (!partnerId || n.partnerId === partnerId) ? { ...n, isRead: true } : n);
        this.saveNotifications(notifications);
    }

    private addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): void {
        const newNotification: Notification = {
            ...notification,
            id:        this.generateId(),
            timestamp: new Date().toISOString(),
            isRead:    false,
        };
        this.saveNotifications([newNotification, ...this.notificationsSubject.value]);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}