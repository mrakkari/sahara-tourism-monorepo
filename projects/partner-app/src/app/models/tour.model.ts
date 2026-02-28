/**
 * Tour Type Definitions
 * These are the ONLY valid tour types for the system
 */

export enum TourType {
    BIVOUAC = 'Bivouac',
    DEMI_PENSION_SUITE_REVEILLON = 'Demi Pension SUITE Reveillon',
    DEMI_PENSION_REVEILLON = 'Demi Pension Reveillon',
    NUITEE_CAMP_DP = 'Nuitée Camp DP',
    SORTIE_1H30_4X4 = 'Sortie 1h30 4x4',
    TENTE_SUITE_DP = 'Tente Suite DP',
    TENTE_SUITE_ADULTE = 'tente suite adulte',
    TOZEUR_TATAOUINE_MATMATA = 'tozeur_tataouine_matmata'
}

export interface TourInfo {
    id: TourType;
    name: string;
    description: string;
    basePrice: number;
    adultPrice: number;
    childPrice: number;
    minParticipants: number;
    maxParticipants: number;
    duration: string;
    icon?: string;
    image?: string;
}

export interface TourStatistics {
    tourType: TourType;
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
export const TOUR_CATALOG: Record<TourType, TourInfo> = {
    [TourType.BIVOUAC]: {
        id: TourType.BIVOUAC,
        name: 'Bivouac',
        description: 'Nuit sous les étoiles dans le désert',
        basePrice: 120,
        adultPrice: 120,
        childPrice: 60,
        minParticipants: 2,
        maxParticipants: 50,
        duration: '1 nuit',
        icon: '🏜️'
    },
    [TourType.DEMI_PENSION_SUITE_REVEILLON]: {
        id: TourType.DEMI_PENSION_SUITE_REVEILLON,
        name: 'Demi Pension SUITE Reveillon',
        description: 'Demi-pension en suite pour le réveillon',
        basePrice: 250,
        adultPrice: 250,
        childPrice: 125,
        minParticipants: 2,
        maxParticipants: 30,
        duration: '1 nuit',
        icon: '🎉'
    },
    [TourType.DEMI_PENSION_REVEILLON]: {
        id: TourType.DEMI_PENSION_REVEILLON,
        name: 'Demi Pension Reveillon',
        description: 'Demi-pension pour le réveillon',
        basePrice: 180,
        adultPrice: 180,
        childPrice: 90,
        minParticipants: 2,
        maxParticipants: 40,
        duration: '1 nuit',
        icon: '🎊'
    },
    [TourType.NUITEE_CAMP_DP]: {
        id: TourType.NUITEE_CAMP_DP,
        name: 'Nuitée Camp DP',
        description: 'Nuitée au campement avec demi-pension',
        basePrice: 85,
        adultPrice: 85,
        childPrice: 42.5,
        minParticipants: 2,
        maxParticipants: 60,
        duration: '1 nuit',
        icon: '⛺'
    },
    [TourType.SORTIE_1H30_4X4]: {
        id: TourType.SORTIE_1H30_4X4,
        name: 'Sortie 1h30 4x4',
        description: 'Excursion en 4x4 dans le désert',
        basePrice: 50,
        adultPrice: 50,
        childPrice: 25,
        minParticipants: 1,
        maxParticipants: 20,
        duration: '1h30',
        icon: '🚙'
    },
    [TourType.TENTE_SUITE_DP]: {
        id: TourType.TENTE_SUITE_DP,
        name: 'Tente Suite DP',
        description: 'Tente suite avec demi-pension',
        basePrice: 150,
        adultPrice: 150,
        childPrice: 75,
        minParticipants: 2,
        maxParticipants: 40,
        duration: '1 nuit',
        icon: '🏕️'
    },
    [TourType.TENTE_SUITE_ADULTE]: {
        id: TourType.TENTE_SUITE_ADULTE,
        name: 'tente suite adulte',
        description: 'Tente suite pour adultes',
        basePrice: 140,
        adultPrice: 140,
        childPrice: 70,
        minParticipants: 2,
        maxParticipants: 30,
        duration: '1 nuit',
        icon: '🛏️'
    },
    [TourType.TOZEUR_TATAOUINE_MATMATA]: {
        id: TourType.TOZEUR_TATAOUINE_MATMATA,
        name: 'tozeur_tataouine_matmata',
        description: 'Circuit Tozeur, Tataouine et Matmata',
        basePrice: 280,
        adultPrice: 280,
        childPrice: 140,
        minParticipants: 4,
        maxParticipants: 35,
        duration: '3 jours',
        icon: '🗺️'
    }
};

/**
 * Helper function to get all tour types as array
 */
export function getAllTourTypes(): TourType[] {
    return Object.values(TourType);
}

/**
 * Helper function to get tour info by type
 */
export function getTourInfo(tourType: TourType): TourInfo {
    return TOUR_CATALOG[tourType];
}

/**
 * Helper function to get tour name by type
 */
export function getTourName(tourType: TourType): string {
    return TOUR_CATALOG[tourType].name;
}
