export interface Reservation {
    id: string;
    partnerId?: string; // For partner filtering
    partnerName: string;
    tourType?: string; // Tour type selection (Bivouac, Demi Pension, etc.)
    source?: string; // Reservation source (Airbnb, Booking, App, etc.)
    numberOfPeople: number;
    adults: number;
    children: number;
    checkInDate: string;
    checkOutDate: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'arrived' | 'cancelled';
    groupInfo: GroupInfo;
    payment: PaymentInfo;
    extras: Extra[];
    loyaltyPointsEarned?: number;
    promoCode?: string;
    discountAmount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    reservationId?: string;
    partnerId: string; // To show only to relevant partner
    type: 'reservation_status' | 'payment' | 'system';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    link?: string;
}

export interface GroupInfo {
    participants: Participant[];
    specialRequests?: string;
    tourType?: 'Bivouac' | 'Demi Pension SUITE Reveillon' | 'Demi Pension Reveillon' | 'Nuitée Camp DP' | 'Sortie 1h30 4x4' | 'Tente Suite DP' | 'tente suite adulte' | 'touzeur _ tataouine_ matmata';
}

export interface Participant {
    name: string;
    age: number;
    isAdult: boolean;
}

export interface PaymentInfo {
    totalAmount: number;
    paidAmount: number;
    currency: 'TND' | 'EUR' | 'USD';
    paymentMethod?: 'card' | 'cash' | 'transfer' | 'flouci' | 'onsite' | 'mixed';
    paymentStatus: 'pending' | 'partial' | 'completed';
    transactions: Transaction[];
}

export interface Transaction {
    id: string;
    amount: number;
    date: string;
    method: 'flouci' | 'onsite' | 'transfer' | 'card';
    status?: 'pending' | 'completed' | 'failed';
    description?: string;
}

export interface Extra {
    id: string;
    type: 'quad' | '4x4' | 'meal' | 'dromedary' | 'sandboarding' | 'bedouin-dinner' | 'other';
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Invoice {
    reservationId: string;
    invoiceNumber: string;
    issueDate: string;
    partnerName: string;
    baseAmount: number;
    extrasAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
}
