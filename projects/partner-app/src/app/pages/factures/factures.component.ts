import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceStatus, PaymentStatus } from '../../models/invoice.model';
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../core/services/translate.pipe';

@Component({
    selector: 'app-factures',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './factures.component.html',
    styleUrls: ['./factures.component.scss']
})
export class FacturesComponent implements OnInit {
    invoices: Invoice[] = [];
    filteredInvoices: Invoice[] = [];
    paginatedInvoices: Invoice[] = [];
    loading = true;

    statusFilter: 'all' | InvoiceStatus = 'all';
    paymentStatusFilter: 'all' | PaymentStatus = 'all';
    sortBy: 'date' | 'amount' = 'date';
    sortOrder: 'desc' | 'asc' = 'desc';
    searchQuery = '';

    selectedInvoice: Invoice | null = null;

    // Pagination properties
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 0;

    // Expose Math to template
    Math = Math;

    constructor(
        private invoiceService: InvoiceService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.loadInvoices(user.id);
            }
        });
    }

    loadInvoices(partnerId: string) {
        this.loading = true;
        this.invoiceService.getInvoicesByPartner(partnerId).subscribe({
            next: (data) => {
                this.invoices = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading invoices:', err);
                this.loading = false;
            }
        });
    }

    applyFilters() {
        let result = [...this.invoices];

        if (this.statusFilter !== 'all') {
            result = result.filter(inv => inv.status === this.statusFilter);
        }

        if (this.paymentStatusFilter !== 'all') {
            result = result.filter(inv => inv.paymentStatus === this.paymentStatusFilter);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(query) ||
                inv.reservationReference.toLowerCase().includes(query) ||
                inv.groupLeaderName.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            let comparison = 0;
            if (this.sortBy === 'date') {
                comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
            } else if (this.sortBy === 'amount') {
                comparison = a.totalAmount - b.totalAmount;
            }
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredInvoices = result;
        this.currentPage = 1; // Reset to first page when filters change
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxPagesToShow = 5;
        
        if (this.totalPages <= maxPagesToShow) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (this.currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push(-1); // Ellipsis
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                pages.push(1);
                pages.push(-1); // Ellipsis
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push(-1); // Ellipsis
                pages.push(this.currentPage - 1);
                pages.push(this.currentPage);
                pages.push(this.currentPage + 1);
                pages.push(-1); // Ellipsis
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }

    viewDetails(invoice: Invoice) {
        this.selectedInvoice = invoice;
    }

    closeDetails() {
        this.selectedInvoice = null;
    }

    downloadInvoice(invoice: Invoice) {
        this.invoiceService.generatePdf(invoice);
    }

    getPaymentStatusClass(status: PaymentStatus): string {
        switch (status) {
            case PaymentStatus.PAID: return 'payment-paid';
            case PaymentStatus.UNPAID: return 'payment-unpaid';
            case PaymentStatus.PARTIAL: return 'payment-partial';
            default: return '';
        }
    }

    getPaymentStatusLabel(status: PaymentStatus): string {
        const labels: Record<PaymentStatus, string> = {
            [PaymentStatus.PAID]: 'Payée',
            [PaymentStatus.UNPAID]: 'Non payée',
            [PaymentStatus.PARTIAL]: 'Partiellement payée'
        };
        return labels[status] || status;
    }

    getInvoiceStatusClass(status: InvoiceStatus): string {
        switch (status) {
            case InvoiceStatus.PAID: return 'status-paid';
            case InvoiceStatus.UNPAID: return 'status-unpaid';
            case InvoiceStatus.OVERDUE: return 'status-overdue';
            case InvoiceStatus.CANCELLED: return 'status-cancelled';
            default: return '';
        }
    }

    getInvoiceStatusLabel(status: InvoiceStatus): string {
        const labels: Record<InvoiceStatus, string> = {
            [InvoiceStatus.DRAFT]: 'Brouillon',
            [InvoiceStatus.SENT]: 'Envoyée',
            [InvoiceStatus.PAID]: 'Payée',
            [InvoiceStatus.UNPAID]: 'Non payée',
            [InvoiceStatus.OVERDUE]: 'En retard',
            [InvoiceStatus.CANCELLED]: 'Annulée'
        };
        return labels[status] || status;
    }

    isOverdue(invoice: Invoice): boolean {
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today && invoice.remainingAmount > 0;
    }

    getPaymentPercentage(invoice: Invoice): number {
        if (invoice.totalAmount === 0) return 0;
        return Math.round((invoice.paidAmount / invoice.totalAmount) * 100);
    }
}