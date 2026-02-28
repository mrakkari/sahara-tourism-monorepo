import { Injectable } from '@angular/core';
import { Partner } from '../models/partner.model';
import { Invoice, PaymentStatus as InvoicePaymentStatus, InvoiceStatus } from '../models/invoice.model';
import { TourType, getAllTourTypes } from '../models/tour.model';
import { Reservation, ReservationStatus } from '../models/reservation.model';

@Injectable({
    providedIn: 'root'
})
export class MockDataService {

    // CRITICAL: These are the ONLY valid tour types
    readonly TOUR_TYPES = getAllTourTypes();

    constructor() { }

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
        
        // Realistic group names and their leaders
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
                groupLeaderName: groupData.groupName,  // Group name as main display
                leaderName: groupData.leaderName,      // Actual leader name (you'll need to add this field to your model)
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

    /**
     * Get mock reservations for Kantaoui Travel with CORRECT tour types
     * Generates reservations distributed over different time periods:
     * - Last 30 days: ~16 reservations
     * - Last 90 days (quarter): ~35 reservations
     * - Last 365 days (year): ~100 reservations
     */
    getMockReservations(): Reservation[] {
        const reservations: Reservation[] = [];
        const now = new Date();

        // PERIOD 1: Last 30 days - 16 reservations
        reservations.push(...this.generateReservationsForPeriod(16, 0, 30, now));

        // PERIOD 2: Days 31-90 - 19 more reservations (total 35 for quarter)
        reservations.push(...this.generateReservationsForPeriod(19, 31, 90, now));

        // PERIOD 3: Days 91-365 - 65 more reservations (total 100 for year)
        reservations.push(...this.generateReservationsForPeriod(65, 91, 365, now));

        return reservations;
    }

    /**
     * Generate reservations for a specific time period
     */
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

        for (let i = 0; i < count; i++) {
            // Random date within the specified range
            const daysAgo = minDaysAgo + Math.floor(Math.random() * (maxDaysAgo - minDaysAgo));
            const createdDate = new Date(referenceDate);
            createdDate.setDate(createdDate.getDate() - daysAgo);

            const tourType = this.TOUR_TYPES[i % this.TOUR_TYPES.length];
            const status = statuses[i % 3];
            const adultsCount = 10 + Math.floor(Math.random() * 25); // 10-35 adults
            const childrenCount = Math.floor(Math.random() * 8); // 0-8 children
            const totalPeople = adultsCount + childrenCount;

            // Calculate price based on tour type
            const basePrice = this.getTourBasePrice(tourType);
            const totalPrice = (adultsCount * basePrice) + (childrenCount * basePrice * 0.5);

            // Apply 5% discount for groups of 20+
            const finalPrice = totalPeople >= 20 ? totalPrice * 0.95 : totalPrice;

            // Check-in date is a few days after reservation
            const checkInDate = new Date(createdDate);
            checkInDate.setDate(checkInDate.getDate() + 5 + Math.floor(Math.random() * 10));
            
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + (tourType === TourType.TOZEUR_TATAOUINE_MATMATA ? 3 : 1));

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

    /**
     * Get base price for a tour type
     */
    private getTourBasePrice(tourType: TourType): number {
        const prices: Record<TourType, number> = {
            [TourType.BIVOUAC]: 120,
            [TourType.DEMI_PENSION_SUITE_REVEILLON]: 250,
            [TourType.DEMI_PENSION_REVEILLON]: 180,
            [TourType.NUITEE_CAMP_DP]: 85,
            [TourType.SORTIE_1H30_4X4]: 50,
            [TourType.TENTE_SUITE_DP]: 150,
            [TourType.TENTE_SUITE_ADULTE]: 140,
            [TourType.TOZEUR_TATAOUINE_MATMATA]: 280
        };
        return prices[tourType];
    }

    /**
     * Generate participants for a reservation
     */
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

    /**
     * Generate extras for a reservation
     */
    private generateExtras(index: number): any[] {
        if (index % 3 === 0) {
            return [
                {
                    id: 'quad-1',
                    type: 'quad',
                    name: 'Quad',
                    quantity: 5,
                    unitPrice: 50,
                    totalPrice: 250
                }
            ];
        }
        return [];
    }

    /**
     * Get promotional content for home page
     */
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