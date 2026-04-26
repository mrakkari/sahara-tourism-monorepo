
import { ChauffeurResponse, GuideResponse, SourceResponse } from "../../../../../shared/src/models/reservation-api.model";
import { Currency } from "../../../../../shared/src/models/transaction.model";

export type ReservationType = 'HEBERGEMENT' | 'TOURS' | 'EXTRAS';

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

// NEW — maps ReservationTourResponse from backend
export interface TourSnapshot {
  reservationTourId: string;
  name: string;
  description: string;
  duration: string;
  adultPrice: number;
  childPrice: number;
  numberOfAdults: number;
  numberOfChildren: number;
  departureDate: string;
  totalPrice: number;
}

export interface GroupInfo {
  participants: Participant[];
  specialRequests?: string;
  groupName?: string;
  groupLeaderName?: string;
  tourType?: string;
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
  currency?: Currency;
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

export interface Reservation {
  id: string;
  reservationId: string;
  partnerId?: string;
  partnerName: string;
  userId?: string;
  userName?: string;
  groupName?: string;
  groupLeaderName?: string;
  numberOfPeople: number;
  adults: number;
  children: number;
  numberOfAdults?: number;
  numberOfChildren?: number;

  // ── Date fields ─────────────────────────────────────────
  // HEBERGEMENT: use checkInDate / checkOutDate
  // TOURS + EXTRAS: use serviceDate (departure / service date)
  checkInDate: string;
  checkOutDate: string;
  serviceDate?: string;           // ← NEW: TOURS departure date / EXTRAS service date

  // ── Type ────────────────────────────────────────────────
  reservationType?: ReservationType;  // ← NEW

  status: 'pending' | 'confirmed' | 'rejected' | 'checked_in' | 'cancelled' | 'completed';
  rejectionReason?: string | null;
  groupInfo: GroupInfo;
  payment: PaymentInfo;

  // ── Content arrays ────────────────────────────────────────
  extras: Extra[];
  tourTypes?: TourTypeSnapshot[];     // HEBERGEMENT
  tours?: TourSnapshot[];             // ← NEW: TOURS type

  totalAmount?: number;
  totalExtrasAmount?: number;
  currency?: Currency;
  promoCode?: string | null;
  demandeSpecial?: string | null;
  loyaltyPointsEarned?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  source?: SourceResponse;           // ← was source?: string
  guides?: GuideResponse[];          // ← NEW
  chauffeurs?: ChauffeurResponse[];
}