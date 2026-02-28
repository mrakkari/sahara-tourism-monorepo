export interface Client {
    id: string;
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    matriculeFiscale?: string;
    type: 'Passagère' | 'Partenaire';
    dateCreation?: Date;
}

export interface Prestation {
    id?: string;
    type: string;
    date: Date;
    nombrePersonnes: number;
}

export interface Reservation {
    id: string;
    clientId: string;
    client?: Client;
    prestations: Prestation[];
    dateEnregistrement: Date;
    facture?: boolean;
    proforma?: boolean;
    status?: 'pending' | 'confirmed' | 'cancelled';
    totalAmount?: number;
}

export interface Notification {
    id: string;
    type: 'new_reservation' | 'payment_received' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    icon?: string;
}

export interface ReservationStats {
    totalReservations: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
    growthPercentage: number;
}

export interface RevenueStats {
    totalRevenue: number;
    monthlyRevenue: number[];
    revenueGrowth: number;
}
