// camping-app/src/app/core/models/camping.model.ts

export interface AddExtraRequest {
  reservationId: string;
  extraId: string;
  quantity: number;
}