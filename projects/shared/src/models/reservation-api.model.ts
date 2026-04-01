// =============================================
// ENUMS
// =============================================

export type ReservationType = 'HEBERGEMENT' | 'TOURS' | 'EXTRAS';
export type BackendReservationStatus =
  | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN'
  | 'CANCELLED' | 'REJECTED' | 'COMPLETED';

// =============================================
// REQUEST DTOs
// =============================================

export interface TourTypeSelectionRequest {
  tourTypeId: string;
  numberOfAdults: number;
  numberOfChildren: number;
}

export interface TourSelectionRequest {
  tourId: string;
  //departureDate: string; // 'YYYY-MM-DD'
}

export interface ParticipantRequest {
  fullName: string;
  age: number;
  isAdult: boolean;
}

export interface ReservationExtraRequest {
  extraId: string;
  quantity: number;
}

export interface ReservationRequest {
  userId?: string;
  source?: string;
  reservationType: ReservationType;

  // HEBERGEMENT only
  checkInDate?: string;
  checkOutDate?: string;

    // TOURS + EXTRAS — shared date field
  // TOURS:  departure date of the tour
  // EXTRAS: date the extras service takes place
  serviceDate?: string;

  groupName?: string;
  groupLeaderName?: string;
  demandeSpecial?: string;
  numberOfAdults: number;
  numberOfChildren: number;
  currency?: string;
  promoCode?: string;

  // HEBERGEMENT — min 1 required
  tourTypes?: TourTypeSelectionRequest[];

  // TOURS — exactly 1
  tours?: TourSelectionRequest[];

  participants?: ParticipantRequest[];
  extras?: ReservationExtraRequest[];
}

// =============================================
// RESPONSE DTOs
// =============================================

export interface ReservationTourTypeResponse {
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

export interface ReservationTourResponse {
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

export interface ParticipantResponse {
  participantId: string;
  fullName: string;
  age: number;
  isAdult: boolean;
}

export interface ReservationExtraResponse {
  reservationExtraId: string;
  reservationId: string;
  name: string;
  description: string;
  duration: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isActive: boolean;
}

export interface ReservationResponse {
  reservationId: string;
  userId: string;
  userName: string;
  source: string;
  reservationType: ReservationType;
  checkInDate?: string;
  checkOutDate?: string;
  serviceDate?: string;
  groupName: string;
  groupLeaderName: string;
  numberOfAdults: number;
  numberOfChildren: number;
  status: BackendReservationStatus;
  rejectionReason?: string;
  totalAmount?: number;
  currency: string;
  promoCode?: string;
  demandeSpecial?: string | null;
  createdAt: string;
  tourTypes: ReservationTourTypeResponse[];
  tours: ReservationTourResponse[];
  participants: ParticipantResponse[];
  extras: ReservationExtraResponse[];
  totalExtrasAmount: number;
  deletedAt?: string | null;
}