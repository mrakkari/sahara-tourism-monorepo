export interface Address {
    street: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface ContactInfo {
    phone: string;
    email: string;
    website?: string;
    contactPerson?: string;
}

export interface Partner {
    id: string;
    name: string;
    logo?: string;
    address: Address;
    contactInfo: ContactInfo;
    creationDate: Date;
    contractStartDate: Date;
    pricingTier: 'standard' | 'gold' | 'platinum';
    accountManager?: string;
    commissionRate: number; // percentage
}
