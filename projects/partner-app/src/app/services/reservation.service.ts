import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Notification } from '../models/reservation.model';
import { ExtraResponse } from '../models/extra.model';
import { isToday, isTomorrow, isInDateRange } from '../utils/date-utils';
import { HttpClient } from '@angular/common/http';
import { TourType } from '../models/tour.model';
import { DEFAULT_TOUR_IMAGE, TOUR_TYPE_IMAGES } from '../core/constants/images';
import { ReservationRequest, ReservationResponse } from '../models/reservation-api.model';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly NOTIFS_KEY = 'sahara-notifications';
    private apiUrl = 'http://localhost:8080/api';

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadNotifications();
    }

    // ─── My Reservations ──────────────────────────────────────────
    getMyReservations(): Observable<ReservationResponse[]> {
        return this.http.get<ReservationResponse[]>(this.apiUrl + '/reservations/my-reservations');
    }

    // ─── Tour Types ───────────────────────────────────────────────
    getAllTourTypes(): Observable<TourType[]> {
        return this.http.get<TourType[]>(this.apiUrl + '/tour-types').pipe(
            map(tourTypes => tourTypes.map(tt => ({
                ...tt,
                image: TOUR_TYPE_IMAGES[tt.name] ?? DEFAULT_TOUR_IMAGE
            })))
        );
    }

    // ─── Extras ───────────────────────────────────────────────────
    getActiveExtras(): Observable<ExtraResponse[]> {
        return this.http.get<ExtraResponse[]>(this.apiUrl + '/extras').pipe(
            map(extras => extras.filter(e => e.isActive))
        );
    }

    // ─── Create Reservation ───────────────────────────────────────
    createReservation(request: ReservationRequest): Observable<ReservationResponse> {
        return this.http.post<ReservationResponse>(
            this.apiUrl + '/reservations',
            request
        );
    }

    // ─── Update Reservation (CLIENT / PARTENAIRE) ─────────────────
    updateReservation(reservationId: string, request: any): Observable<ReservationResponse> {
        return this.http.put<ReservationResponse>(
            `${this.apiUrl}/reservations/${reservationId}`,
            request
        );
    }

    // ─── Cancel Reservation ───────────────────────────────────────
    cancelReservation(reservationId: string): Observable<ReservationResponse> {
        return this.http.patch<ReservationResponse>(
            `${this.apiUrl}/reservations/${reservationId}/status?status=CANCELLED`,
            {}
        );
    }

    // ─── Notifications (local) ────────────────────────────────────
    getNotifications(): Observable<Notification[]> {
        return this.notifications$;
    }

    getUnreadCount(partnerId?: string): number {
        return this.notificationsSubject.value.filter(
            n => !n.isRead && (!partnerId || n.partnerId === partnerId)
        ).length;
    }

    markAsRead(id: string): void {
        const notifications = this.notificationsSubject.value.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        );
        this.saveNotifications(notifications);
    }

    markAllAsRead(partnerId?: string): void {
        const notifications = this.notificationsSubject.value.map(n =>
            (!partnerId || n.partnerId === partnerId) ? { ...n, isRead: true } : n
        );
        this.saveNotifications(notifications);
    }

    // ─── Private helpers ──────────────────────────────────────────
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

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}