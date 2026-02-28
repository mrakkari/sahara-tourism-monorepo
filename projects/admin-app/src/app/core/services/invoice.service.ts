import { Injectable } from '@angular/core';
import { Reservation, Invoice } from '../models/reservation.model';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    generateInvoice(reservation: Reservation): Invoice {
        const baseAmount = reservation.payment.totalAmount - reservation.extras.reduce((sum, e) => sum + e.totalPrice, 0);
        const extrasAmount = reservation.extras.reduce((sum, e) => sum + e.totalPrice, 0);

        return {
            reservationId: reservation.id,
            invoiceNumber: `INV-${new Date().getFullYear()}-${reservation.id.toUpperCase().slice(0, 8)}`,
            issueDate: new Date().toISOString(),
            partnerName: reservation.partnerName,
            baseAmount,
            extrasAmount,
            totalAmount: reservation.payment.totalAmount,
            paidAmount: reservation.payment.paidAmount,
            remainingAmount: reservation.payment.totalAmount - reservation.payment.paidAmount
        };
    }

    formatCurrency(amount: number): string {
        return `${amount.toFixed(2)} TND`;
    }

    calculateBasePrice(adults: number, children: number): number {
        const adultPrice = 200; // TND per adult per night
        const childPrice = 100; // TND per child per night
        return (adults * adultPrice) + (children * childPrice);
    }
}
