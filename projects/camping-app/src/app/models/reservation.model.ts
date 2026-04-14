// camping-app/src/app/core/models/reservation.model.ts
// Camping-app local model — mapped from shared ReservationResponse

export type ReservationType = 'HEBERGEMENT' | 'TOURS' | 'EXTRAS';

export type FrontendStatus =
  | 'pending' | 'confirmed' | 'checked_in'
  | 'cancelled' | 'rejected' | 'completed';

export type PaymentStatus = 'pending' | 'partial' | 'completed';

// ── Snapshots ─────────────────────────────────────────────────────

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

// ── Extra ─────────────────────────────────────────────────────────

export interface Extra {
  id: string;
  reservationExtraId: string;
  reservationId: string;
  type: 'transport' | 'meal' | 'activity' | 'accommodation' | 'other';
  name: string;
  description?: string;
  duration?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isActive: boolean;
}

export interface ExtraCatalog {
  extraId: string;
  name: string;
  description?: string | null;
  duration?: string | null;
  unitPrice: number;
  isActive: boolean;
}

// ── AddExtraRequest ───────────────────────────────────────────────

export interface AddExtraRequest {
  reservationId: string;
  extraId: string;
  quantity: number;
}

// ── Participant ───────────────────────────────────────────────────

export interface Participant {
  name: string;
  age: number;
  isAdult: boolean;
}

export interface GroupInfo {
  participants: Participant[];
  specialRequests?: string;
  tourType?: string;
  groupName?: string;
  groupLeaderName?: string;
  leaderName?: string;
}

// ── Transaction (camping-app local — mapped from backend) ─────────

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  method: 'flouci' | 'onsite' | 'transfer' | 'card' | 'cash' | 'cheque' | 'bank_transfer' | 'credit_card' | 'debit_card';
  status?: 'pending' | 'completed' | 'failed';
  description?: string;
}

// ── PaymentInfo ───────────────────────────────────────────────────

export interface PaymentInfo {
  totalAmount: number;
  paidAmount: number;
  currency: 'TND' | 'EUR' | 'USD';
  paymentStatus: PaymentStatus;
  transactions: Transaction[];
}

// ── Reservation (fully mapped, used throughout camping-app) ───────

export interface Reservation {
  id: string;
  reservationId: string;
  partnerId?: string;
  partnerName: string;
  userName?: string;
  source?: string;
  groupName?: string;
  groupLeaderName?: string;
  numberOfPeople: number;
  adults: number;
  children: number;
  numberOfAdults?: number;
  numberOfChildren?: number;

  reservationType?: ReservationType;

  checkInDate: string;
  checkOutDate: string;
  serviceDate?: string;

  status: FrontendStatus;
  rejectionReason?: string | null;

  groupInfo: GroupInfo;
  payment: PaymentInfo;

  tourTypes?: TourTypeSnapshot[];
  tours?: TourSnapshot[];
  extras: Extra[];

  totalAmount?: number;
  totalExtrasAmount?: number;
  currency?: string;
  promoCode?: string | null;
  demandeSpecial?: string | null;
  loyaltyPointsEarned?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──────────────────────────────────────────────────

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