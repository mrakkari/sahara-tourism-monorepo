export interface Tour {
  tourId: string;
  name: string;
  description?: string;
  duration?: string; // informational e.g. "7 jours / 6 nuits"
  passengerAdultPrice: number;
  passengerChildPrice: number;
  partnerAdultPrice: number;
  partnerChildPrice: number;
  isActive: boolean;
}