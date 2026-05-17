// admin/src/app/core/models/facture.model.ts

export type InvoiceType    = 'STANDARD' | 'PROFORMA' | 'CREDIT_NOTE';
export type InvoiceStatus  = 'DRAFT' | 'SENT' | 'CANCELLED';
export type PaymentStatus  = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export interface FactureItemResponse {
  invoiceItemId: string;
  description:   string;
  itemType:      string;
  quantity:      number;
  unitPrice:     number;
  totalPrice:    number;
  lineNumber:    number;
}

export interface FactureResponse {
  invoiceId:      string;
  invoiceNumber:  string;
  invoiceType:    InvoiceType;
  invoiceDate:    string;
  dueDate?:       string | null;

  // Amounts
  totalAmount:    number;
  paidAmount:     number;
  remainingAmount: number;

  // TVA fields (only for STANDARD / facture)
  totalHt?:       number | null;
  tvaRate?:       number | null;
  tvaAmount?:     number | null;
  timbreFiscal?:  number | null;
  totalTtc?:      number | null;

  // Arrêté text
  arreteLaPresente?: string | null;

  status:         InvoiceStatus;
  paymentStatus:  PaymentStatus;
  currency:       string;

  reservationId:  string;

  // User / client fields
  userId:              string;
  userName?:           string;
  userEmail?:          string;
  userPhone?:          string;
  userMatriculeFiscal?: string;
  userAgencyAddress?:  string;

  items: FactureItemResponse[];
}