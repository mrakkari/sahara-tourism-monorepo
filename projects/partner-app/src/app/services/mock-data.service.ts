import { Injectable } from '@angular/core';
import { Partner } from '../models/partner.model';
import { Invoice, PaymentStatus as InvoicePaymentStatus, InvoiceStatus } from '../models/invoice.model';
import { Reservation, ReservationStatus } from '../models/reservation.model';
import { ReservationService } from './reservation.service';

@Injectable({
    providedIn: 'root'
})
export class MockDataService {

    private tourTypes: string[] = [];

    constructor(private reservationService: ReservationService) {
        this.reservationService.getAllTourTypes().subscribe(types => {
            this.tourTypes = types.map(t => t.name);
        });
    }

    getKantaouiTravelData(): Partner {
        return {
            id: 'partner-001',
            name: 'Kantaoui Travel',
            logo: 'assets/images/partners/kantaoui-logo.png',
            address: {
                street: 'Avenue 14 Janvier',
                city: 'Sousse',
                postalCode: '4000',
                country: 'Tunisie'
            },
            contactInfo: {
                phone: '+216 73 220 220',
                email: 'contact@kantaouitravel.tn',
                website: 'www.kantaouitravel.tn',
                contactPerson: 'Ahmed Ben Ali'
            },
            creationDate: new Date('2020-03-15'),
            contractStartDate: new Date('2020-04-01'),
            pricingTier: 'gold',
            accountManager: 'Sarah Connor',
            commissionRate: 15
        };
    }

    getMockInvoices(): Invoice[] {
        const invoices: Invoice[] = [];
        const paymentStatuses = [InvoicePaymentStatus.PAID, InvoicePaymentStatus.UNPAID, InvoicePaymentStatus.PARTIAL];
        const invoiceStatuses = [InvoiceStatus.PAID, InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE];

        const groupsData = [
            { groupName: 'Aventuriers du Désert', leaderName: 'Sophie Dubois', partnerId: 'p1' },
            { groupName: 'Desert Explorers Club', leaderName: 'Marco Rossi', partnerId: 'p2' },
            { groupName: 'Famille Martin', leaderName: 'Jean-Pierre Martin', partnerId: 'p3' },
            { groupName: 'Sahara Discovery Team', leaderName: 'Emma Schmidt', partnerId: 'p4' },
            { groupName: 'Les Nomades', leaderName: 'Ahmed Ben Salem', partnerId: 'p5' },
            { groupName: 'Sunset Travelers', leaderName: 'Carlos Fernandez', partnerId: 'p6' },
            { groupName: 'Groupe Évasion Tunisie', leaderName: 'Marie Lefebvre', partnerId: 'p7' },
            { groupName: 'Golden Dunes Expedition', leaderName: 'David Johnson', partnerId: 'p8' },
            { groupName: 'Famille Ben Ali', leaderName: 'Karim Ben Ali', partnerId: 'p9' },
            { groupName: 'Oasis Seekers', leaderName: 'Laura Bianchi', partnerId: 'p10' },
            { groupName: 'Desert Dream Team', leaderName: 'Thomas Wagner', partnerId: 'p11' },
            { groupName: 'Les Voyageurs du Sud', leaderName: 'Nathalie Dupont', partnerId: 'p12' },
            { groupName: 'Sahara Spirit Group', leaderName: 'Mohamed Trabelsi', partnerId: 'p13' },
            { groupName: 'Adventure Seekers UK', leaderName: 'James Anderson', partnerId: 'p14' },
            { groupName: 'Famille Rousseau', leaderName: 'Pierre Rousseau', partnerId: 'p15' }
        ];

        for (let i = 1; i <= 15; i++) {
            const groupData = groupsData[i - 1];
            const total = 500 + Math.floor(Math.random() * 2000);
            const paymentStatus = paymentStatuses[i % 3];
            const invoiceStatus = invoiceStatuses[i % 3];
            const paid = paymentStatus === InvoicePaymentStatus.PAID ? total :
                (paymentStatus === InvoicePaymentStatus.PARTIAL ? Math.floor(total / 2) : 0);

            const invoiceDate = new Date(2026, (i % 12), 10);
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30);

            invoices.push({
                id: `inv-${i}`,
                invoiceNumber: `INV-2026-${100 + i}`,
                reservationId: `res-${i}`,
                reservationReference: `REF-${2026000 + i}`,
                groupLeaderName: groupData.groupName,
                leaderName: groupData.leaderName,
                partnerId: groupData.partnerId,
                invoiceDate: invoiceDate,
                dueDate: dueDate,
                totalAmount: total,
                paidAmount: paid,
                remainingAmount: total - paid,
                status: invoiceStatus,
                paymentStatus: paymentStatus,
                items: [
                    { description: 'Tour Package', quantity: 1, unitPrice: total * 0.8, total: total * 0.8 },
                    { description: 'Extras', quantity: 1, unitPrice: total * 0.2, total: total * 0.2 }
                ],
                documentUrl: 'assets/documents/sample-invoice.pdf'
            });
        }

        return invoices;
    }

    getDashboardStats() {
        return {
            pendingReservations: 5,
            confirmedReservations: 12,
            totalRevenue: 12500,
            unpaidInvoices: 3
        };
    }

    getMockReservations(): Reservation[] {
        const reservations: Reservation[] = [];
        const now = new Date();

        reservations.push(...this.generateReservationsForPeriod(16, 0, 30, now));
        reservations.push(...this.generateReservationsForPeriod(19, 31, 90, now));
        reservations.push(...this.generateReservationsForPeriod(65, 91, 365, now));

        return reservations;
    }

    private generateReservationsForPeriod(count: number, minDaysAgo: number, maxDaysAgo: number, referenceDate: Date): Reservation[] {
        const reservations: Reservation[] = [];
        const statuses: ReservationStatus[] = ['confirmed', 'pending', 'rejected'];
        const tunisianNames = [
            'Ahmed Ben Ali', 'Fatma Khedher', 'Mohamed Amri', 'Salma Trabelsi',
            'Karim Bouazizi', 'Leila Mansour', 'Youssef Gharbi', 'Amira Jlassi',
            'Mehdi Sassi', 'Nour Hamdi', 'Rami Chatti', 'Sonia Belaid',
            'Tarek Maaloul', 'Hiba Dridi', 'Walid Karray', 'Sofiane Ltaief',
            'Mariem Touil', 'Bassem Gharbi', 'Ines Karoui', 'Fares Messaoud'
        ];

        // Fallback names in case backend hasn't responded yet
        const fallbackTourTypes = ['Bivouac', 'Demi Pension Reveillon', 'Nuitée Camp DP', 'Tente Suite DP'];
        const activeTourTypes = this.tourTypes.length > 0 ? this.tourTypes : fallbackTourTypes;

        for (let i = 0; i < count; i++) {
            const daysAgo = minDaysAgo + Math.floor(Math.random() * (maxDaysAgo - minDaysAgo));
            const createdDate = new Date(referenceDate);
            createdDate.setDate(createdDate.getDate() - daysAgo);

            const tourType = activeTourTypes[i % activeTourTypes.length]; // now a plain string
            const status = statuses[i % 3];
            const adultsCount = 10 + Math.floor(Math.random() * 25);
            const childrenCount = Math.floor(Math.random() * 8);
            const totalPeople = adultsCount + childrenCount;

            const basePrice = this.getTourBasePrice(tourType);
            const totalPrice = (adultsCount * basePrice) + (childrenCount * basePrice * 0.5);
            const finalPrice = totalPeople >= 20 ? totalPrice * 0.95 : totalPrice;

            const checkInDate = new Date(createdDate);
            checkInDate.setDate(checkInDate.getDate() + 5 + Math.floor(Math.random() * 10));

            const checkOutDate = new Date(checkInDate);
            // Use string comparison instead of enum
            checkOutDate.setDate(checkOutDate.getDate() + (tourType === 'touzeur _ tataouine_ matmata' ? 3 : 1));

            const randomNameIndex = Math.floor(Math.random() * tunisianNames.length);
            const randomId = Date.now() + Math.floor(Math.random() * 100000);

            reservations.push({
                id: `res-${randomId}`,
                partnerId: 'partner-001',
                partnerName: 'Kantaoui Travel',
                contactInfo: {
                    firstName: tunisianNames[randomNameIndex].split(' ')[0],
                    lastName: tunisianNames[randomNameIndex].split(' ').slice(1).join(' '),
                    email: `${tunisianNames[randomNameIndex].toLowerCase().replace(/ /g, '.')}@example.tn`,
                    phone: `+216 ${20 + Math.floor(Math.random() * 79)} ${100 + i} ${200 + i}`
                },
                numberOfPeople: totalPeople,
                adults: adultsCount,
                children: childrenCount,
                checkInDate: checkInDate.toISOString(),
                checkOutDate: checkOutDate.toISOString(),
                status: status,
                tourType: tourType,
                totalPrice: Math.round(finalPrice),
                groupInfo: {
                    participants: this.generateParticipants(adultsCount, childrenCount),
                    specialRequests: i % 3 === 0 ? 'Régime végétarien pour 2 personnes' : undefined,
                    tourType: tourType
                },
                payment: {
                    totalAmount: Math.round(finalPrice),
                    paidAmount: status === 'confirmed' ? Math.round(finalPrice) : (status === 'pending' ? Math.round(finalPrice * 0.3) : 0),
                    currency: 'EUR',
                    paymentMethod: status === 'confirmed' ? 'transfer' : undefined,
                    paymentStatus: status === 'confirmed' ? 'paid' : (status === 'pending' ? 'partial' : 'unpaid'),
                    transactions: []
                },
                extras: this.generateExtras(i),
                promoCode: i % 5 === 0 ? 'SUMMER10' : undefined,
                discountAmount: totalPeople >= 20 ? Math.round(totalPrice * 0.05) : 0,
                createdAt: createdDate.toISOString(),
                updatedAt: createdDate.toISOString(),
                rejectionReason: status === 'rejected' ? 'Capacité maximale atteinte pour la période demandée.' : undefined
            });
        }

        return reservations;
    }

    // Now accepts string instead of TourType enum
    private getTourBasePrice(tourType: string): number {
        const prices: Record<string, number> = {
            'Bivouac': 120,
            'Demi Pension SUITE Reveillon': 250,
            'Demi Pension Reveillon': 180,
            'Nuitée Camp DP': 85,
            'Sortie 1h30 4x4': 50,
            'Tente Suite DP': 150,
            'tente suite adulte': 140,
            'touzeur _ tataouine_ matmata': 280
        };
        return prices[tourType] ?? 100; // fallback if new tour type added by admin
    }

    private generateParticipants(adultsCount: number, childrenCount: number): any[] {
        const participants = [];
        const firstNames = ['Ahmed', 'Fatma', 'Mohamed', 'Salma', 'Karim', 'Leila', 'Youssef', 'Amira'];

        for (let i = 0; i < adultsCount; i++) {
            participants.push({
                name: `${firstNames[i % firstNames.length]} ${i + 1}`,
                age: 25 + Math.floor(Math.random() * 40),
                isAdult: true
            });
        }

        for (let i = 0; i < childrenCount; i++) {
            participants.push({
                name: `Enfant ${i + 1}`,
                age: 5 + Math.floor(Math.random() * 10),
                isAdult: false
            });
        }

        return participants;
    }

    private generateExtras(index: number): any[] {
        if (index % 3 === 0) {
            return [{
                id: 'quad-1',
                type: 'quad',
                name: 'Quad',
                quantity: 5,
                unitPrice: 50,
                totalPrice: 250
            }];
        }
        return [];
    }

    getPromotionalContent() {
        return [
            {
                title: '🎉 Nouvelles offres exclusives ce mois-ci!',
                description: 'Profitez de nos réductions spéciales sur tous les circuits du désert.',
                icon: '🎉',
                color: '#FF6B6B'
            },
            {
                title: '💰 Profitez de nos réductions spéciales!',
                description: '5% de réduction automatique pour les groupes de 20 personnes et plus.',
                icon: '💰',
                color: '#4ECDC4'
            },
            {
                title: '👥 Offres exceptionnelles pour vos groupes!',
                description: 'Des tarifs préférentiels pour vos clients en groupe.',
                icon: '👥',
                color: '#95E1D3'
            }
        ];
    }
}