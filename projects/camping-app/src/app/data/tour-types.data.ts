/**
 * Real Tour Types with Pricing
 * Prices are in Tunisian Dinar (TND)
 * Each tour type has two price columns:
 * - prixPartenaire: Partner Price
 * - prixPassagere: Passenger Price
 */

export interface TourType {
    id: string;
    name: string;
    prixPartenaire: number; // in TND
    prixPassagere: number; // in TND
}

export const TOUR_TYPES: TourType[] = [
    {
        id: 'animation-folklorique',
        name: 'Animation Folklorique',
        prixPartenaire: 300,
        prixPassagere: 300
    },
    {
        id: 'balade-dromadaire',
        name: 'Balade Dromadaire',
        prixPartenaire: 30,
        prixPassagere: 30
    },
    {
        id: 'bivouac',
        name: 'Bivouac',
        prixPartenaire: 160,
        prixPassagere: 185
    },
    {
        id: 'dp-gratuite-groupe-25',
        name: 'DP Gratuité Groupe +25',
        prixPartenaire: -110,
        prixPassagere: -110
    },
    {
        id: 'demi-pension',
        name: 'Demi Pension',
        prixPartenaire: 110,
        prixPassagere: 160
    },
    {
        id: 'demi-pension-1er-enf',
        name: 'Demi Pension 1er Enf',
        prixPartenaire: 55,
        prixPassagere: 70
    },
    {
        id: 'demi-pension-reveillon',
        name: 'Demi Pension Reveillon',
        prixPartenaire: 300,
        prixPassagere: 300
    },
    {
        id: 'demi-pension-suite-reveillon',
        name: 'Demi Pension SUITE Reveillon',
        prixPartenaire: 550,
        prixPassagere: 550
    },
    {
        id: 'dp-2-tente',
        name: 'Dp 2 tente',
        prixPartenaire: 120,
        prixPassagere: 120
    },
    {
        id: 'nuitee-camp-dp',
        name: 'Nuitée Camp DP',
        prixPartenaire: 110,
        prixPassagere: 160
    },
    {
        id: 'nuitee-camp-dp-1er-enfant',
        name: 'Nuitée Camp DP 1er enfant',
        prixPartenaire: 55,
        prixPassagere: 80
    },
    {
        id: 'pension-complet',
        name: 'Pension Complet',
        prixPartenaire: 150,
        prixPassagere: 210
    },
    {
        id: 'pension-complet-1er-enf',
        name: 'Pension Complet 1er Enf',
        prixPartenaire: 75,
        prixPassagere: 100
    },
    {
        id: 'sortie-1h30-4x4',
        name: 'Sortie 1h30 4x4',
        prixPartenaire: 210,
        prixPassagere: 210
    },
    {
        id: 'supplement-dp-vacance',
        name: 'Supplément DP Vacance',
        prixPartenaire: 20,
        prixPassagere: 20
    },
    {
        id: 'tente-suite-dp',
        name: 'Tente Suite DP',
        prixPartenaire: 185,
        prixPassagere: 220
    },
    {
        id: 'dp-camp-6-tentes',
        name: 'dp camp 6 tentes',
        prixPartenaire: 120,
        prixPassagere: 120
    },
    {
        id: 'tente-suite-adulte',
        name: 'tente suite adulte',
        prixPartenaire: 200,
        prixPassagere: 200
    },
    {
        id: 'tente-suite-enfant',
        name: 'tente suite enfant',
        prixPartenaire: 100,
        prixPassagere: 100
    },
    {
        id: 'touzeur-tataouine-matmata',
        name: 'touzeur _ tataouine_ matmata',
        prixPartenaire: 114,
        prixPassagere: 114
    }
];

/**
 * Helper function to get tour type by ID
 */
export function getTourTypeById(id: string): TourType | undefined {
    return TOUR_TYPES.find(tt => tt.id === id);
}

/**
 * Helper function to get tour type by name
 */
export function getTourTypeByName(name: string): TourType | undefined {
    return TOUR_TYPES.find(tt => tt.name === name);
}
