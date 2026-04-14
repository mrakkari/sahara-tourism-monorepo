// camping-app/src/app/core/models/camping.model.ts
// Only camping-specific models — everything else comes from shared

export interface AddExtraRequest {
  reservationId: string;
  extraId: string;
  quantity: number;
}