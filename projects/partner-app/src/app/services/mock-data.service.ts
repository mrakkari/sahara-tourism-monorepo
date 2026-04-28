import { Injectable } from '@angular/core';
import { Partner } from '../models/partner.model';
import { Invoice, PaymentStatus as InvoicePaymentStatus, InvoiceStatus } from '../models/invoice.model';
import { ReservationService } from '../../../../shared/src/services/reservation.service';
import { ReservationResponse } from '../../../../shared/src/models/reservation-api.model';
import { Observable } from 'rxjs';

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

    // ── Real reservations from the API ────────────────────────────
    getReservations(): Observable<ReservationResponse[]> {
        return this.reservationService.getMyReservations();
    }

    // ── Static partner data ───────────────────────────────────────
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

    // ── Static invoice mock data ──────────────────────────────────
    getMockInvoices(): Invoice[] {
        const invoices: Invoice[] = [];
        const paymentStatuses = [InvoicePaymentStatus.PAID, InvoicePaymentStatus.UNPAID, InvoicePaymentStatus.PARTIAL];
        const invoiceStatuses = [InvoiceStatus.PAID, InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE];

        const groupsData = [
            { groupName: 'Aventuriers du Désert',    leaderName: 'Sophie Dubois',       partnerId: 'p1'  },
            { groupName: 'Desert Explorers Club',    leaderName: 'Marco Rossi',         partnerId: 'p2'  },
            { groupName: 'Famille Martin',           leaderName: 'Jean-Pierre Martin',  partnerId: 'p3'  },
            { groupName: 'Sahara Discovery Team',    leaderName: 'Emma Schmidt',        partnerId: 'p4'  },
            { groupName: 'Les Nomades',              leaderName: 'Ahmed Ben Salem',     partnerId: 'p5'  },
            { groupName: 'Sunset Travelers',         leaderName: 'Carlos Fernandez',    partnerId: 'p6'  },
            { groupName: 'Groupe Évasion Tunisie',   leaderName: 'Marie Lefebvre',      partnerId: 'p7'  },
            { groupName: 'Golden Dunes Expedition',  leaderName: 'David Johnson',       partnerId: 'p8'  },
            { groupName: 'Famille Ben Ali',          leaderName: 'Karim Ben Ali',       partnerId: 'p9'  },
            { groupName: 'Oasis Seekers',            leaderName: 'Laura Bianchi',       partnerId: 'p10' },
            { groupName: 'Desert Dream Team',        leaderName: 'Thomas Wagner',       partnerId: 'p11' },
            { groupName: 'Les Voyageurs du Sud',     leaderName: 'Nathalie Dupont',     partnerId: 'p12' },
            { groupName: 'Sahara Spirit Group',      leaderName: 'Mohamed Trabelsi',    partnerId: 'p13' },
            { groupName: 'Adventure Seekers UK',     leaderName: 'James Anderson',      partnerId: 'p14' },
            { groupName: 'Famille Rousseau',         leaderName: 'Pierre Rousseau',     partnerId: 'p15' }
        ];

        for (let i = 1; i <= 15; i++) {
            const groupData = groupsData[i - 1];
            const total = 500 + Math.floor(Math.random() * 2000);
            const paymentStatus = paymentStatuses[i % 3];
            const invoiceStatus = invoiceStatuses[i % 3];
            const paid = paymentStatus === InvoicePaymentStatus.PAID ? total
                       : paymentStatus === InvoicePaymentStatus.PARTIAL ? Math.floor(total / 2)
                       : 0;

            const invoiceDate = new Date(2026, (i % 12), 10);
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30);

            invoices.push({
                id:                   `inv-${i}`,
                invoiceNumber:        `INV-2026-${100 + i}`,
                reservationId:        `res-${i}`,
                reservationReference: `REF-${2026000 + i}`,
                groupLeaderName:      groupData.groupName,
                leaderName:           groupData.leaderName,
                partnerId:            groupData.partnerId,
                invoiceDate,
                dueDate,
                totalAmount:          total,
                paidAmount:           paid,
                remainingAmount:      total - paid,
                status:               invoiceStatus,
                paymentStatus,
                items: [
                    { description: 'Tour Package', quantity: 1, unitPrice: total * 0.8, total: total * 0.8 },
                    { description: 'Extras',       quantity: 1, unitPrice: total * 0.2, total: total * 0.2 }
                ],
                documentUrl: 'assets/documents/sample-invoice.pdf'
            });
        }

        return invoices;
    }

    // ── Dashboard stats (static placeholders) ────────────────────
    getDashboardStats() {
        return {
            pendingReservations:   5,
            confirmedReservations: 12,
            totalRevenue:          12500,
            unpaidInvoices:        3
        };
    }

    // ── Promotional content ───────────────────────────────────────
    getPromotionalContent() {
        return [
            {
                title:       '🎉 Nouvelles offres exclusives ce mois-ci!',
                description: 'Profitez de nos réductions spéciales sur tous les circuits du désert.',
                icon:        '🎉',
                color:       '#FF6B6B'
            },
            {
                title:       '💰 Profitez de nos réductions spéciales!',
                description: '5% de réduction automatique pour les groupes de 20 personnes et plus.',
                icon:        '💰',
                color:       '#4ECDC4'
            },
            {
                title:       '👥 Offres exceptionnelles pour vos groupes!',
                description: 'Des tarifs préférentiels pour vos clients en groupe.',
                icon:        '👥',
                color:       '#95E1D3'
            }
        ];
    }
}