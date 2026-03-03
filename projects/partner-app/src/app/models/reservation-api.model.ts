// =============================================
// REQUEST DTOs — match backend ReservationRequest
// =============================================

export interface TourTypeSelectionRequest {
  tourTypeId: string; // UUID
  numberOfAdults: number;
  numberOfChildren: number;
}

export interface ParticipantRequest {
  fullName: string;
  age: number;
  isAdult: boolean;
}

export interface ReservationExtraRequest {
  extraId: string; // UUID
  quantity: number;
}

export interface ReservationRequest {
  userId?: string;          // UUID — current logged-in user
  source?: string;          // e.g. 'PARTNER_APP'
  checkInDate: string;      // LocalDate format: 'YYYY-MM-DD'
  checkOutDate: string;     // LocalDate format: 'YYYY-MM-DD'
  groupName?: string;
  groupLeaderName?: string;
  demandeSpecial?: string;
  numberOfAdults: number;
  numberOfChildren: number;
  currency?: string;
  promoCode?: string;
  tourTypes: TourTypeSelectionRequest[];
  participants?: ParticipantRequest[];
  extras?: ReservationExtraRequest[];
}

// =============================================
// RESPONSE DTOs — match backend ReservationResponse
// =============================================

export type BackendReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';

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
  checkInDate: string;
  checkOutDate: string;
  groupName: string;
  groupLeaderName: string;
  numberOfAdults: number;
  numberOfChildren: number;
  status: BackendReservationStatus;
  rejectionReason: string;
  totalAmount: number;
  currency: string;
  promoCode: string;
  tourTypes: ReservationTourTypeResponse[];
  participants: ParticipantResponse[];
  extras: ReservationExtraResponse[];
  totalExtrasAmount: number;
}