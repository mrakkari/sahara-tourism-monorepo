export interface Reservation {
  reservationId: string;
  id: string;
  partnerId?: string;
  partnerName: string;
  userId?: string;
  userName?: string;
  source?: string;
  groupName?: string;
  groupLeaderName?: string;
  numberOfPeople: number;
  adults: number;
  children: number;
  numberOfAdults?: number;
  numberOfChildren?: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'checked_in' | 'cancelled' | 'completed'; // ← removed 'arrived', added 'completed'
  rejectionReason?: string | null;
  groupInfo: GroupInfo;
  payment: PaymentInfo;
  extras: Extra[];
  tourTypes?: TourTypeSnapshot[];
  totalAmount?: number;
  totalExtrasAmount?: number;
  currency?: string;
  promoCode?: string | null;
  demandeSpecial?: string | null;
  loyaltyPointsEarned?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TourTypeSnapshot {
  reservationTourTypeId: string;
  name: string;
  description: string;
  duration: string;
  adultPrice: number;
  childPrice: number;
  numberOfAdults: number;
  numberOfChildren: number;
  totalPrice: number;
  numberOfNights?: number | null;
}

export interface GroupInfo {
  participants: Participant[];
  specialRequests?: string;
  groupName?: string;
  groupLeaderName?: string;
  tourType?: string; // ← loosened from hard-coded union, backend drives this now
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
  paymentStatus: 'pending' | 'partial' | 'completed';
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
  reservationExtraId: string;
  reservationId: string;
  name: string;
  description?: string;
  duration?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isActive: boolean;
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