
export type UserRole = 'CLIENT' | 'PARTENAIRE' | 'CAMPING' | 'ADMIN';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
  taxId?: string;
  commissionRate?: number;
}