// shared/src/models/user.model.ts

export type UserRole = 'CLIENT' | 'PARTENAIRE' | 'CAMPING' | 'ADMIN';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;

  // CLIENT-only
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;

  // PARTENAIRE-only
  matriculeFiscal?: string;
  agencyAddress?: string;
}

// Request body for POST /api/users/add (admin creates a user)
export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  role: UserRole;                // CLIENT or PARTENAIRE
  matriculeFiscal?: string;      // only when role = PARTENAIRE
  agencyAddress?: string;        // only when role = PARTENAIRE
  // No password — backend generates it and sends by email
}

// Request body for PUT /api/users/:id (admin updates a user)
export interface UpdateUserRequest {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  matriculeFiscal?: string;
  agencyAddress?: string;
}