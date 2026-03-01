// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;        // Always 'PARTENAIRE' for the register page
  taxId?: string;
  commissionRate?: number;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: string;
  email: string;
  name: string;
}

// ─── Client-side user model (after decoding JWT) ─────────────────────────────

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;   // PARTENAIRE | CAMPING | ADMIN
}
