export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'arrived' | 'cancelled' | 'completed';

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'paid' | 'unpaid';

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Reservation {
  id: string;
  partnerId?: string;
  partnerName: string;
  contactInfo: ContactInfo;
  numberOfPeople: number;
  adults: number;
  children: number;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  groupInfo: GroupInfo;
  payment: PaymentInfo;
  extras: Extra[];
  loyaltyPointsEarned?: number;
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;

  tourType?: string;        // Tour type name (from backend API)
  totalPrice?: number;
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  reservationId?: string;
  partnerId: string;
  type: 'reservation_status' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface GroupInfo {
  participants: Participant[];
  specialRequests?: string;
  tourType?: string;        // Tour type name (from backend API)
}

export interface Participant {
  name: string;
  age: number;
  isAdult: boolean;
}

export interface PaymentInfo {
  totalAmount: number;
  paidAmount: number;
  currency: 'TND' | 'EUR' | 'USD';
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'flouci' | 'onsite' | 'mixed';
  paymentStatus: PaymentStatus;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  method: 'flouci' | 'onsite' | 'transfer' | 'card';
  status?: 'pending' | 'completed' | 'failed';
  description?: string;
}

export interface ExtraResponse {
  extraId: string;
  name: string;
  description?: string;
  duration?: string;
  unitPrice: number;
  isActive: boolean;
}

// Used inside a Reservation (after user selects quantity)
export interface Extra {
  extraId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // calculated: quantity * unitPrice
}

export interface Invoice {
  reservationId: string;
  invoiceNumber: string;
  issueDate: string;
  partnerName: string;
  baseAmount: number;
  extrasAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}