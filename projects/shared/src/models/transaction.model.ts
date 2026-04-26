// shared/src/models/transaction.model.ts

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'CHEQUE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type Currency = 'TND' | 'EUR' | 'USD'; 

export interface TransactionResponse {
  transactionId: string;
  transactionNumber: string;
  amount: number;
  currency: Currency; 
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  transactionDate: string; // ISO datetime
  reservationId: string;
  invoiceId?: string | null;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  currency: Currency;
}

export interface PaymentSummary {
  originalMainAmount: number;
  originalExtrasAmount: number;
  originalTotalAmount: number;
  totalPaid: number;
  remainingMainAmount: number;
  remainingExtrasAmount: number;
  remainingTotal: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
}

export interface PaymentResponse {
  transactionId: string;
  transactionNumber: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  transactionDate: string;
  reservationId: string;
  paymentSummary: PaymentSummary;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:          'Espèces',
  CREDIT_CARD:   'Carte de crédit',
  DEBIT_CARD:    'Carte de débit',
  BANK_TRANSFER: 'Virement bancaire',
  ONLINE:        'Paiement en ligne',
  CHEQUE:        'Chèque',
};
export const CURRENCY_LABELS: Record<Currency, string> = {
  TND: '🇹🇳 Dinar Tunisien (TND)',
  EUR: '🇪🇺 Euro (EUR)',
  USD: '🇺🇸 Dollar US (USD)',
};

export const CURRENCY_RATES: Record<Currency, number> = {
  TND: 1.0,
  EUR: 3.5,
  USD: 2.9,
};