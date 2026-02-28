import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Reservation, Extra, Transaction, Notification } from '../models/reservation.model';
import { isToday, isTomorrow, isInDateRange } from '../utils/date-utils';
import { PARTNERS, getRandomPartner } from '../data/partners.data';
import { TOUR_TYPES, getTourTypeById } from '../data/tour-types.data';
import { GROUP_NAMES, getRandomGroupName } from '../data/group-names.data';

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
        if (reservations.length < 30 || !localStorage.getItem('sahara-mock-v4-real-data')) {
            localStorage.setItem('sahara-mock-v4-real-data', 'true');
            const today = new Date();
            const mockReservations: Reservation[] = [];

            // 1. Pending Reservations (15 items) - Future Dates
            for (let i = 0; i < 15; i++) {
                const checkIn = new Date(today);
                checkIn.setDate(today.getDate() + 3 + i); // Starts 3 days from now
                const duration = 2 + (i % 3);
                const checkOut = new Date(checkIn);
                checkOut.setDate(checkIn.getDate() + duration);

                const partner = PARTNERS[i % PARTNERS.length];
                const tourType = TOUR_TYPES[i % TOUR_TYPES.length];
                const groupName = GROUP_NAMES[i % GROUP_NAMES.length];
                const numPeople = 5 + (i % 25); // Realistic group sizes: 5-30 people
                const numAdults = Math.ceil(numPeople * 0.7);
                const numChildren = numPeople - numAdults;

                mockReservations.push({
                    id: `pending-${i + 1}`,
                    partnerId: partner.id,
                    partnerName: partner.name,
                    numberOfPeople: numPeople,
                    adults: numAdults,
                    children: numChildren,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'pending',
                    groupInfo: {
                        participants: [{ name: groupName, age: 40, isAdult: true }],
                        leaderName: groupName,
                        tourType: tourType.name
                    },
                    payment: {
                        totalAmount: (tourType.prixPassagere * numAdults) + (tourType.prixPassagere * 0.5 * numChildren),
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

                const partner = PARTNERS[(i + 5) % PARTNERS.length];
                const tourType = TOUR_TYPES[(i + 7) % TOUR_TYPES.length];
                const groupName = GROUP_NAMES[(i + 10) % GROUP_NAMES.length];
                const numPeople = 8 + (i % 18); // Realistic group sizes: 8-25 people
                const numAdults = Math.ceil(numPeople * 0.75);
                const numChildren = numPeople - numAdults;

                const totalAmount = (tourType.prixPassagere * numAdults) + (tourType.prixPassagere * 0.5 * numChildren);
                const paidAmount = totalAmount * 0.5; // 50% paid

                mockReservations.push({
                    id: `confirmed-${i + 1}`,
                    partnerId: partner.id,
                    partnerName: partner.name,
                    numberOfPeople: numPeople,
                    adults: numAdults,
                    children: numChildren,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'confirmed',
                    groupInfo: {
                        participants: [{ name: groupName, age: 40, isAdult: true }],
                        leaderName: groupName,
                        tourType: tourType.name
                    },
                    payment: {
                        totalAmount: totalAmount,
                        paidAmount: paidAmount,
                        currency: 'TND',
                        paymentStatus: 'partial',
                        transactions: [{ id: `txn-${i}`, amount: paidAmount, date: new Date().toISOString(), method: 'transfer', status: 'completed' }]
                    },
                    extras: [],
                    loyaltyPointsEarned: Math.floor(totalAmount * 0.1),
                    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // 3. Arrived/Completed (20 items) - Past/Current
            // Increased from 10 to 20 to fill the default view
            for (let i = 0; i < 20; i++) {
                const checkIn = new Date(today);
                checkIn.setDate(today.getDate() - (i % 5)); // Recent arrivals within last 5 days
                const duration = 3;
                const checkOut = new Date(checkIn);
                checkOut.setDate(checkIn.getDate() + duration);

                const partner = PARTNERS[(i + 3) % PARTNERS.length];
                const tourType = TOUR_TYPES[(i + 2) % TOUR_TYPES.length];
                const groupName = GROUP_NAMES[(i + 15) % GROUP_NAMES.length];
                const numPeople = 6 + (i % 20); // Realistic group sizes: 6-25 people
                const numAdults = Math.ceil(numPeople * 0.8);
                const numChildren = numPeople - numAdults;

                const baseAmount = (tourType.prixPassagere * numAdults) + (tourType.prixPassagere * 0.5 * numChildren);

                const transactions: Transaction[] = [];
                // Add onsite payments for the first 10 arrived groups
                const extraAmount = i < 10 ? 150 + (i * 50) : 0;
                if (i < 10) {
                    transactions.push({
                        id: `onsite-${i}`,
                        amount: extraAmount,
                        date: new Date().toISOString(),
                        method: 'onsite',
                        status: 'completed',
                        description: 'Paiement complémentaire (Extras/Bar)'
                    });
                }

                // Vary payment status: some are fully paid, some partial
                const totalAmount = baseAmount + extraAmount;
                const paidAmount = i % 3 === 0 ? totalAmount : totalAmount * 0.6; // Every 3rd is fully paid, others 60% paid

                mockReservations.push({
                    id: `arrived-${i + 1}`,
                    partnerId: partner.id,
                    partnerName: partner.name,
                    numberOfPeople: numPeople,
                    adults: numAdults,
                    children: numChildren,
                    checkInDate: checkIn.toISOString(),
                    checkOutDate: checkOut.toISOString(),
                    status: 'arrived',
                    groupInfo: {
                        participants: [{ name: groupName, age: 35, isAdult: true }],
                        leaderName: groupName,
                        tourType: tourType.name
                    },
                    payment: {
                        totalAmount: totalAmount,
                        paidAmount: paidAmount,
                        currency: 'TND',
                        paymentStatus: paidAmount >= totalAmount ? 'completed' : 'partial',
                        transactions: transactions
                    },
                    extras: i < 10 ? [{ id: `ext-${i}`, name: 'Quad Bike', type: 'quad', quantity: 1, unitPrice: 100, totalPrice: 100 }] : [],
                    loyaltyPointsEarned: Math.floor(totalAmount * 0.1),
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

    checkOutReservation(id: string): Reservation | undefined {
        const res = this.updateReservation(id, { status: 'checked-out' });
        if (res) {
            this.addNotification({
                partnerId: res.partnerId || 'unknown',
                type: 'reservation_status',
                title: 'Check-out Completed',
                message: `Reservation #${id.substring(0, 6)} has checked out.`,
                link: `/payment-history`,
                reservationId: id
            });
        }
        return res;
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
