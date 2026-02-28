// Updated Invoice interface with leaderName field

export interface Invoice {
    id: string;
    invoiceNumber: string;
    reservationId: string;
    reservationReference: string;
    groupLeaderName: string;        // Group name (e.g., "Aventuriers du Désert")
    leaderName: string;              // NEW: Actual leader name (e.g., "Sophie Dubois")
    partnerId?: string;
    invoiceDate: Date;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: InvoiceStatus;
    paymentStatus: PaymentStatus;
    items: InvoiceItem[];
    documentUrl?: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PAID = 'paid',
    UNPAID = 'unpaid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PAID = 'paid',
    UNPAID = 'unpaid',
    PARTIAL = 'partial'
}

// Alternative naming if you prefer (both work the same)
export enum InvoicePaymentStatus {
    PAID = 'paid',
    UNPAID = 'unpaid',
    PARTIAL = 'partial'
}