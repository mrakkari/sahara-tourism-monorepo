import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable ,map } from 'rxjs';
import { Reservation, Extra, Transaction, Notification, ExtraResponse } from '../models/reservation.model';
import { isToday, isTomorrow, isInDateRange } from '../utils/date-utils';
import { MockDataService } from './mock-data.service';
import { HttpClient } from '@angular/common/http';
import { TourType } from '../models/tour.model';
import { DEFAULT_TOUR_IMAGE, TOUR_TYPE_IMAGES } from '../core/constants/images';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly STORAGE_KEY = 'sahara-reservations';
    private readonly NOTIFS_KEY = 'sahara-notifications';
    private apiUrl = 'http://localhost:8080/api';

    
    private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
    public reservations$ = this.reservationsSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadReservations();
        this.loadNotifications();
    }

    getAllTourTypes(): Observable<TourType[]> {
        return this.http.get<TourType[]>(this.apiUrl + '/tour-types').pipe(
            map(tourTypes =>
                tourTypes.map(tt => ({
                    ...tt,
                image: TOUR_TYPE_IMAGES[tt.name] ?? DEFAULT_TOUR_IMAGE
            }))
        ));
    }

  getActiveExtras(): Observable<ExtraResponse[]> {
    return this.http.get<ExtraResponse[]>(this.apiUrl + '/extras').pipe(
      map(extras => extras.filter(e => e.isActive))
    );
  }

    private loadReservations(): void {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.reservationsSubject.next(JSON.parse(stored));
        }
    }

    private saveReservations(reservations: Reservation[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reservations));
        this.reservationsSubject.next(reservations);
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


    private initializeNotifications(): void {
        const notifs = this.notificationsSubject.value;
        if (notifs.length === 0) {
            const today = new Date();
            const mockNotifications: Notification[] = [
                {
                    id: '1',
                    partnerId: 'partner-001',
                    title: 'Reservation Confirmed',
                    message: 'Your reservation #confirmed-1 has been approved by admin.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    type: 'reservation_status'
                },
                {
                    id: '2',
                    partnerId: 'partner-001',
                    title: 'Payment Received',
                    message: 'We have received your transfer of 600 TND for reservation #confirmed-1.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 30).toISOString(),
                    isRead: false,
                    type: 'payment'
                },
                {
                    id: '3',
                    partnerId: 'partner-001',
                    title: 'New Feature Alert',
                    message: 'Check out the new Calendar view to manage your availability!',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 2).toISOString(),
                    isRead: false,
                    type: 'system'
                },
                {
                    id: '4',
                    partnerId: 'partner-001',
                    title: 'Points Earned',
                    message: 'You earned 120 Loyalty Points from your last booking.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24).toISOString(),
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '5',
                    partnerId: 'partner-001',
                    title: 'Reservation Rejected',
                    message: 'Reservation #pending-x was rejected due to full capacity.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 48).toISOString(),
                    isRead: true,
                    type: 'reservation_status'
                },
                {
                    id: '6',
                    partnerId: 'partner-001',
                    title: 'Maintenance Update',
                    message: 'System will be under maintenance on Sunday at 2 AM.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '7',
                    partnerId: 'partner-001',
                    title: 'Invoice Generated',
                    message: 'Invoice #INV-2024-001 is now available for download.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
                    isRead: true,
                    type: 'payment'
                },
                {
                    id: '8',
                    partnerId: 'p2',
                    title: 'Welcome Partner',
                    message: 'Welcome to the Sahara Tourism platform!',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '9',
                    partnerId: 'partner-001',
                    title: 'Seasonal Promo',
                    message: 'Use code SAHARA10 for 10% off next week bookings.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '10',
                    partnerId: 'partner-001',
                    title: 'Group Arrival',
                    message: 'Group "Desert Fox" has arrived safely at camp.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 5).toISOString(),
                    isRead: false,
                    type: 'reservation_status'
                }
            ];
            this.saveNotifications(mockNotifications);
        }
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

    getReservationsByPartner(partnerId: string): Reservation[] {
        return this.reservationsSubject.value.filter(r => r.partnerId === partnerId);
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

    getNotifications(): Observable<Notification[]> {
        return this.notifications$;
    }

    getUnreadCount(partnerId?: string): number {
        return this.notificationsSubject.value.filter(n => !n.isRead && (!partnerId || n.partnerId === partnerId)).length;
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

    private addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): void {
        const newNotification: Notification = {
            ...notification,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            isRead: false
        };
        const notifications = [newNotification, ...this.notificationsSubject.value];
        this.saveNotifications(notifications);
    }

    createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation {
        const totalAmount = reservation.payment?.totalAmount || 0;
        const newReservation: Reservation = {
            ...reservation,
            id: this.generateId(),
            status: 'pending', // New reservations always start as pending
            loyaltyPointsEarned: Math.floor(totalAmount * 0.1),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalPrice: totalAmount,
            tourType: reservation.tourType || reservation.groupInfo?.tourType
        };

        const reservations = [...this.reservationsSubject.value, newReservation];
        this.saveReservations(reservations);
        
        // Add notification for new reservation
        this.addNotification({
            partnerId: newReservation.partnerId || 'unknown',
            type: 'reservation_status',
            title: 'Nouvelle Réservation Créée',
            message: `Votre réservation a été créée avec succès et est en attente de confirmation.`,
            link: '/historique',
            reservationId: newReservation.id
        });
        
        return newReservation;
    }

    updateReservation(id: string, updates: Partial<Reservation>): Reservation | undefined {
        const reservations = this.reservationsSubject.value;
        const index = reservations.findIndex(r => r.id === id);

        if (index === -1) return undefined;

        const updatedReservation = {
            ...reservations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Update totalPrice if payment changes
        if (updates.payment?.totalAmount) {
            updatedReservation.totalPrice = updates.payment.totalAmount;
        }

        reservations[index] = updatedReservation;
        this.saveReservations(reservations);
        return updatedReservation;
    }

    confirmReservation(id: string): Reservation | undefined {
        const res = this.updateReservation(id, { status: 'confirmed' });
        if (res) {
            this.addNotification({
                partnerId: res.partnerId || 'unknown',
                type: 'reservation_status',
                title: 'Reservation Confirmed',
                message: `Reservation #${id.substring(0, 6)} has been confirmed!`,
                link: '/my-reservations',
                reservationId: id
            });
        }
        return res;
    }

    rejectReservation(id: string): Reservation | undefined {
        const res = this.updateReservation(id, { status: 'rejected' });
        if (res) {
            this.addNotification({
                partnerId: res.partnerId || 'unknown',
                type: 'reservation_status',
                title: 'Reservation Rejected',
                message: `Reservation #${id.substring(0, 6)} was rejected.`,
                link: '/my-reservations',
                reservationId: id
            });
        }
        return res;
    }

    markAsArrived(id: string): Reservation | undefined {
        return this.updateReservation(id, { status: 'arrived' });
    }

    addExtra(reservationId: string, extra: Omit<Extra, 'id'>): Reservation | undefined {
        const reservation = this.getReservationById(reservationId);
        if (!reservation) return undefined;

        const newExtra: Extra = {
            ...extra,
            extraId: this.generateId()
        };

        const updatedExtras = [...reservation.extras, newExtra];
        const newTotalAmount = reservation.payment.totalAmount + extra.totalPrice;

        return this.updateReservation(reservationId, {
            extras: updatedExtras,
            payment: {
                ...reservation.payment,
                totalAmount: newTotalAmount
            },
            totalPrice: newTotalAmount
        });
    }

    removeExtra(reservationId: string, extraId: string): Reservation | undefined {
        const reservation = this.getReservationById(reservationId);
        if (!reservation) return undefined;

        const extraToRemove = reservation.extras.find(e => e.extraId === extraId);
        if (!extraToRemove) return undefined;

        const updatedExtras = reservation.extras.filter(e => e.extraId !== extraId);
        const newTotalAmount = reservation.payment.totalAmount - extraToRemove.totalPrice;

        return this.updateReservation(reservationId, {
            extras: updatedExtras,
            payment: {
                ...reservation.payment,
                totalAmount: newTotalAmount
            },
            totalPrice: newTotalAmount
        });
    }

    addPayment(reservationId: string, transaction: Omit<Transaction, 'id'>): Reservation | undefined {
        const reservation = this.getReservationById(reservationId);
        if (!reservation) return undefined;

        const newTransaction: Transaction = {
            ...transaction,
            id: this.generateId()
        };

        const updatedTransactions = [...reservation.payment.transactions, newTransaction];
        const newPaidAmount = reservation.payment.paidAmount + transaction.amount;
        const paymentStatus = newPaidAmount >= reservation.payment.totalAmount ? 'completed' :
            newPaidAmount > 0 ? 'partial' : 'pending';

        const res = this.updateReservation(reservationId, {
            payment: {
                ...reservation.payment,
                paidAmount: newPaidAmount,
                paymentStatus,
                transactions: updatedTransactions
            }
        });

        if (res && paymentStatus === 'completed') {
            this.addNotification({
                partnerId: res.partnerId || 'unknown',
                type: 'payment',
                title: 'Payment Completed',
                message: `Payment completed for reservation #${reservationId.substring(0, 6)}.`,
                link: `/payment/${reservationId}`,
                reservationId: reservationId
            });
        }
        return res;
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}