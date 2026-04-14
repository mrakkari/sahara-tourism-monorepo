// shared/src/models/proforma.model.ts

export type InvoiceType = 'STANDARD' | 'PROFORMA' | 'CREDIT_NOTE';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export interface InvoiceItemResponse {
  invoiceItemId: string;
  description: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  lineNumber: number;
  totalPrice: number; // computed: quantity * unitPrice
}

export interface ProformaResponse {
  invoiceId: string;
  invoiceNumber: string;       // PRO-00001
  invoiceType: InvoiceType;    // always PROFORMA here
  invoiceDate: string;         // YYYY-MM-DD
  dueDate?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;     // computed: totalAmount - paidAmount
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  reservationId: string;
  userId: string;
  items: InvoiceItemResponse[];
}