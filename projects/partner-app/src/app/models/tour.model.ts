/**
 * Tour Type Definitions
 * These are the ONLY valid tour types for the system
 */


export interface TourType {
  tourTypeId: string;
  name: string;
  description: string;
  duration: string;
  partnerAdultPrice: number;
  partnerChildPrice: number;
  passengerAdultPrice: number;
  passengerChildPrice: number;
  image?: string; // added on frontend after fetch
}


export interface TourStatistics {
  tourTypeId: string;
  tourTypeName: string;
  reservations: number;
  participants: number;
  revenue: number;
  rank?: number;
}

export interface StatisticsPeriod {
  type: 'this_month' | 'this_quarter' | 'this_year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Complete tour information with pricing
 */
