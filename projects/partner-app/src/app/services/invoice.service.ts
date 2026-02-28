import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { MockDataService } from './mock-data.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
    public invoices$ = this.invoicesSubject.asObservable();

    constructor(private mockDataService: MockDataService) {
        this.loadInvoices();
    }

    private loadInvoices() {
        // In a real app, fetch from API. Here, use mock data.
        const mockInvoices = this.mockDataService.getMockInvoices();
        this.invoicesSubject.next(mockInvoices);
    }

    getInvoicesByPartner(partnerId: string): Observable<Invoice[]> {
        // For now, return all mocks (assuming they are for the logged in partner)
        // In real app, filter by partnerId
        return this.invoices$;
    }

    getInvoiceById(id: string): Invoice | undefined {
        return this.invoicesSubject.value.find(i => i.id === id);
    }

    generatePdf(invoice: Invoice): void {
        const doc = new jsPDF();
        
        // Colors
        const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
        const darkColor: [number, number, number] = [30, 41, 59]; // #1E293B
        const grayColor: [number, number, number] = [100, 116, 139]; // #64748B

        // Header with gradient effect (simulated)
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');

        // Company Name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('KANTAOUI TRAVEL', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Avenue 14 Janvier, Sousse 4000, Tunisie', 14, 27);
        doc.text('Tél: +216 73 220 220 | Email: contact@kantaouitravel.tn', 14, 32);

        // Invoice Title
        doc.setFillColor(247, 247, 247);
        doc.rect(0, 45, 210, 15, 'F');
        
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURE', 14, 54);

        // Invoice Details Box
        doc.setFillColor(248, 250, 252);
        doc.rect(120, 45, 76, 35, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(120, 45, 76, 35);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('N° Facture:', 125, 52);
        doc.text('Date émission:', 125, 60);
        doc.text('Date échéance:', 125, 68);
        doc.text('Référence:', 125, 76);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(invoice.invoiceNumber, 158, 52);
        doc.text(new Date(invoice.invoiceDate).toLocaleDateString('fr-FR'), 158, 60);
        doc.text(new Date(invoice.dueDate).toLocaleDateString('fr-FR'), 158, 68);
        doc.text(invoice.reservationReference, 158, 76);

        // Client Information
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('FACTURÉ À:', 14, 70);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(invoice.groupLeaderName, 14, 78);
        doc.text(`Groupe - Réservation #${invoice.reservationId}`, 14, 84);

        // Items Table
        const tableData = invoice.items.map(item => [
            item.description,
            item.quantity.toString(),
            `${item.unitPrice.toFixed(2)} TND`,
            `${item.total.toFixed(2)} TND`
        ]);

        autoTable(doc, {
            head: [['Description', 'Quantité', 'Prix Unitaire', 'Total']],
            body: tableData,
            startY: 95,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 5,
                textColor: darkColor,
                lineColor: [226, 232, 240],
                lineWidth: 0.5
            },
            columnStyles: {
                0: { cellWidth: 80, halign: 'left' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Summary Box
        const boxY = finalY;
        const boxHeight = 35;
        
        // Background
        doc.setFillColor(248, 250, 252);
        doc.rect(120, boxY, 76, boxHeight, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.rect(120, boxY, 76, boxHeight);

        // Summary Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Montant Total:', 125, boxY + 8);
        doc.text('Montant Payé:', 125, boxY + 16);
        doc.text('Montant Restant:', 125, boxY + 24);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(`${invoice.totalAmount.toFixed(2)} TND`, 188, boxY + 8, { align: 'right' });
        
        // Paid amount in green
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`${invoice.paidAmount.toFixed(2)} TND`, 188, boxY + 16, { align: 'right' });
        
        // Remaining in red if unpaid
        if (invoice.remainingAmount > 0) {
            doc.setTextColor(239, 68, 68); // Red
        } else {
            doc.setTextColor(16, 185, 129); // Green
        }
        doc.text(`${invoice.remainingAmount.toFixed(2)} TND`, 188, boxY + 24, { align: 'right' });

        // Payment Status Badge
        let statusText = '';
        let statusColor: [number, number, number] = [100, 116, 139];
        
        if (invoice.paymentStatus === 'paid') {
            statusText = 'PAYÉE';
            statusColor = [16, 185, 129];
        } else if (invoice.paymentStatus === 'partial') {
            statusText = 'PARTIELLEMENT PAYÉE';
            statusColor = [245, 158, 11];
        } else {
            statusText = 'NON PAYÉE';
            statusColor = [239, 68, 68];
        }

        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(125, boxY + 28, 66, 6, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(statusText, 158, boxY + 32, { align: 'center' });

        // Notes Section
        if (invoice.remainingAmount > 0) {
            const notesY = boxY + boxHeight + 15;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.text('NOTES IMPORTANTES:', 14, notesY);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text(`Le paiement est dû avant le ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}.`, 14, notesY + 6);
            doc.text('Merci d\'effectuer le paiement par virement bancaire.', 14, notesY + 12);
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, pageHeight - 20, 210, 20, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.text('Merci pour votre confiance | Kantaoui Travel - Agence de Voyage Tunisie', 105, pageHeight - 12, { align: 'center' });
        doc.text('www.kantaouitravel.tn', 105, pageHeight - 7, { align: 'center' });

        // Save PDF
        doc.save(`Facture-${invoice.invoiceNumber}.pdf`);
    }
}