import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Reservation, Extra, Transaction, Notification } from '../models/reservation.model';
import { isToday, isTomorrow, isInDateRange } from '../../utils/date-utils';
import { PARTNER_NAMES, TOUR_TYPES, RESERVATION_SOURCES } from '../constants/business-data.constants';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly STORAGE_KEY = 'sahara-reservations';
    private readonly NOTIFS_KEY = 'sahara-notifications';

    private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
    public reservations$ = this.reservationsSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    constructor() {
        this.loadReservations();
        this.loadNotifications();
        this.initializeMockData();
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

    private initializeMockData(): void {
        const reservations = this.reservationsSubject.value;
        if (reservations.length < 30 || !localStorage.getItem('sahara-mock-v3')) {
            localStorage.setItem('sahara-mock-v3', 'true');
            const today = new Date();
            const mockReservations: Reservation[] = [];

            // Convert constants to arrays for easier use
            const partnerNames = Array.from(PARTNER_NAMES);
            const tourTypes = Array.from(TOUR_TYPES);
            const sources = Array.from(RESERVATION_SOURCES);

            // 1. Pending Reservations (15 items) - Future Dates
            for (let i = 0; i < 15; i++) {
                const checkIn = new Date(today);
                checkIn.setDate(today.getDate() + 3 + i);
                const duration = 2 + (i % 3);
                const checkOut = new Date(checkIn);
                checkOut.setDate(checkIn.getDate() + duration);

                mockReservations.push({
                    id: `pending-${i + 1}`,
                    partnerId: `p${i + 1}`,
                    partnerName: partnerNames[i % partnerNames.length],
                    tourType: tourTypes[i % tourTypes.length],
                    source: sources[i % sources.length],
                    numberOfPeople: 2 + (i % 4),
                    adults: 2,
                    children: i % 4,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'pending',
                    groupInfo: {
                        participants: [{ name: `Guest P${i}`, age: 30, isAdult: true }],
                        tourType: tourTypes[i % tourTypes.length] as any
                    },
                    payment: {
                        totalAmount: 400 * (2 + (i % 4)),
                        paidAmount: 0,
                        currency: 'TND',
                        paymentStatus: 'pending',
                        transactions: []
                    },
                    extras: [],
                    loyaltyPointsEarned: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // 2. Confirmed Groups (15 items) - Mix of near future and next month
            for (let i = 0; i < 15; i++) {
                const checkIn = new Date(today);
                // First 3 are TODAY for testing arrivals
                if (i < 3) {
                    checkIn.setHours(0, 0, 0, 0);
                } else {
                    checkIn.setDate(today.getDate() + 1 + (i * 2));
                }
                const duration = 2;
                const checkOut = new Date(checkIn);
                checkOut.setDate(checkIn.getDate() + duration);

                mockReservations.push({
                    id: `confirmed-${i + 1}`,
                    partnerId: `p${(i % 15) + 1}`,
                    partnerName: partnerNames[i % partnerNames.length],
                    tourType: tourTypes[(i + 1) % tourTypes.length],
                    source: sources[(i + 2) % sources.length],
                    numberOfPeople: 4,
                    adults: 4,
                    children: 0,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'confirmed',
                    groupInfo: {
                        participants: [{ name: `Group Lead C${i}`, age: 40, isAdult: true }],
                        tourType: tourTypes[(i + 1) % tourTypes.length] as any
                    },
                    payment: {
                        totalAmount: 1200,
                        paidAmount: 600,
                        currency: 'TND',
                        paymentStatus: 'partial',
                        transactions: [{ id: `txn-${i}`, amount: 600, date: new Date().toISOString(), method: 'transfer', status: 'completed' }]
                    },
                    extras: [],
                    loyaltyPointsEarned: 120,
                    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // 3. Arrived/Completed (10 items) - Past/Current
            for (let i = 0; i < 10; i++) {
                const checkIn = new Date(today);
                checkIn.setDate(today.getDate() - (i % 3)); // Recent arrivals
                const duration = 3;
                const checkOut = new Date(checkIn);
                checkOut.setDate(checkIn.getDate() + duration);

                const transactions: Transaction[] = [];
                // Add onsite payments for the first 5 arrived groups to show in Payment History
                if (i < 5) {
                    transactions.push({
                        id: `onsite-${i}`,
                        amount: 150 + (i * 50),
                        date: new Date().toISOString(),
                        method: 'onsite',
                        status: 'completed',
                        description: 'Paiement complémentaire (Extras/Bar)'
                    });
                }

                mockReservations.push({
                    id: `arrived-${i + 1}`,
                    partnerId: `p${(i % 15) + 1}`,
                    partnerName: partnerNames[i % partnerNames.length],
                    tourType: tourTypes[(i + 3) % tourTypes.length],
                    source: sources[(i + 1) % sources.length],
                    numberOfPeople: 2,
                    adults: 2,
                    children: 0,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'arrived',
                    groupInfo: {
                        participants: [{ name: `Arrived Guest A${i}`, age: 35, isAdult: true }],
                        tourType: tourTypes[(i + 3) % tourTypes.length] as any
                    },
                    payment: {
                        totalAmount: 800 + (i < 5 ? 150 + (i * 50) : 0),
                        paidAmount: 800 + (i < 5 ? 150 + (i * 50) : 0),
                        currency: 'TND',
                        paymentStatus: 'completed',
                        transactions: transactions
                    },
                    extras: [{ id: `ext-${i}`, name: 'Quad Bike', type: 'quad', quantity: 1, unitPrice: 100, totalPrice: 100 }],
                    loyaltyPointsEarned: 80,
                    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            this.saveReservations(mockReservations);
        }
    }

    private initializeNotifications(): void {
        const notifs = this.notificationsSubject.value;
        if (notifs.length === 0) {
            const today = new Date();
            const mockNotifications: Notification[] = [
                {
                    id: '1',
                    partnerId: 'p1',
                    title: 'Reservation Confirmed',
                    message: 'Your reservation #confirmed-1 has been approved by admin.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    type: 'reservation_status'
                },
                {
                    id: '2',
                    partnerId: 'p1',
                    title: 'Payment Received',
                    message: 'We have received your transfer of 600 TND for reservation #confirmed-1.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
                    isRead: false,
                    type: 'payment'
                },
                {
                    id: '3',
                    partnerId: 'p1',
                    title: 'New Feature Alert',
                    message: 'Check out the new Calendar view to manage your availability!',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                    isRead: false,
                    type: 'system'
                },
                {
                    id: '4',
                    partnerId: 'p1',
                    title: 'Points Earned',
                    message: 'You earned 120 Loyalty Points from your last booking.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '5',
                    partnerId: 'p1',
                    title: 'Reservation Rejected',
                    message: 'Reservation #pending-x was rejected due to full capacity.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
                    isRead: true,
                    type: 'reservation_status'
                },
                {
                    id: '6',
                    partnerId: 'p1',
                    title: 'Maintenance Update',
                    message: 'System will be under maintenance on Sunday at 2 AM.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '7',
                    partnerId: 'p1',
                    title: 'Invoice Generated',
                    message: 'Invoice #INV-2024-001 is now available for download.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
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
                    partnerId: 'p1',
                    title: 'Seasonal Promo',
                    message: 'Use code SAHARA10 for 10% off next week bookings.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
                    isRead: true,
                    type: 'system'
                },
                {
                    id: '10',
                    partnerId: 'p1',
                    title: 'Group Arrival',
                    message: 'Group "Desert Fox" has arrived safely at camp.',
                    timestamp: new Date(today.getTime() - 1000 * 60 * 60 * 5).toISOString(),
                    isRead: false,
                    type: 'reservation_status'
                }
            ];
            this.notificationsSubject.next(mockNotifications);
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

    // New filtering methods
    getReservationsForToday(): Reservation[] {
        return this.reservationsSubject.value.filter(r => isToday(r.checkInDate));
    }

    getReservationsForTomorrow(): Reservation[] {
        return this.reservationsSubject.value.filter(r => isTomorrow(r.checkInDate));
    }

    getReservationsByDateRange(start?: Date, end?: Date): Reservation[] {
        return this.reservationsSubject.value.filter(r => isInDateRange(r.checkInDate, start, end));
    }

    // Notification methods
    getNotifications(): Observable<Notification[]> {
        return this.notifications$;
    }

    getUnreadCount(partnerId?: string): number { // Optional partnerId filter
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

    // CRUD operations
    createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation {
        const newReservation: Reservation = {
            ...reservation,
            id: this.generateId(),
            loyaltyPointsEarned: Math.floor(reservation.payment.totalAmount * 0.1), // 1 point per 10 TND
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const reservations = [...this.reservationsSubject.value, newReservation];
        this.saveReservations(reservations);
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
            id: this.generateId()
        };

        const updatedExtras = [...reservation.extras, newExtra];

        return this.updateReservation(reservationId, {
            extras: updatedExtras,
            payment: {
                ...reservation.payment,
                totalAmount: reservation.payment.totalAmount + extra.totalPrice
            }
        });
    }

    removeExtra(reservationId: string, extraId: string): Reservation | undefined {
        const reservation = this.getReservationById(reservationId);
        if (!reservation) return undefined;

        const extraToRemove = reservation.extras.find(e => e.id === extraId);
        if (!extraToRemove) return undefined;

        const updatedExtras = reservation.extras.filter(e => e.id !== extraId);

        return this.updateReservation(reservationId, {
            extras: updatedExtras,
            payment: {
                ...reservation.payment,
                totalAmount: reservation.payment.totalAmount - extraToRemove.totalPrice
            }
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