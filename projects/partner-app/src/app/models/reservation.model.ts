import { TourType } from './tour.model';

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

  // Properties needed for historique component
  tourType?: TourType;      // Tour type (uses TourType enum)
  totalPrice?: number;      // Total price (synced with payment.totalAmount)
  rejectionReason?: string; // Reason if status is rejected
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
  tourType?: TourType;
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

export interface Extra {
  id: string;
  type: 'quad' | '4x4' | 'meal' | 'dromedary' | 'sandboarding' | 'bedouin-dinner' | 'other';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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