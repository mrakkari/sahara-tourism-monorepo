// API response from GET /api/extras
export interface ExtraResponse {
  extraId: string;
  name: string;
  description?: string;
  duration?: string;
  unitPrice: number;
  isActive: boolean;
}

// Used inside a Reservation (after user selects quantity)
export interface Extra {
  extraId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // calculated: quantity * unitPrice
}