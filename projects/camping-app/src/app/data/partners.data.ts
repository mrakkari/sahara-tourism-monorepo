/**
 * Real Partner/Agency List
 * These are the actual tourism agencies partnering with the campement
 */

export interface Partner {
    id: string;
    name: string;
}

export const PARTNERS: Partner[] = [
    {
        id: 'p1',
        name: 'Bonheur voyage'
    },
    {
        id: 'p2',
        name: 'Costa travel'
    },
    {
        id: 'p3',
        name: 'Desert Rose service'
    },
    {
        id: 'p4',
        name: 'Ste Nasri tour travel'
    },
    {
        id: 'p5',
        name: 'Travel Sun'
    },
    {
        id: 'p6',
        name: 'Rawia Travel'
    },
    {
        id: 'p7',
        name: 'Hannon travel'
    },
    {
        id: 'p8',
        name: 'Djerba activities dreams'
    },
    {
        id: 'p9',
        name: 'Inventa tourisme'
    },
    {
        id: 'p10',
        name: 'Lotos voyages'
    },
    {
        id: 'p11',
        name: 'Kantaoui travel'
    },
    {
        id: 'p12',
        name: 'Hadrumétre voyage'
    },
    {
        id: 'p13',
        name: 'Touil travel'
    },
    {
        id: 'p14',
        name: 'Siroko'
    },
    {
        id: 'p15',
        name: 'Tunisian Colors travel'
    }
];

/**
 * Helper function to get partner by ID
 */
export function getPartnerById(id: string): Partner | undefined {
    return PARTNERS.find(p => p.id === id);
}

/**
 * Helper function to get random partner
 */
export function getRandomPartner(): Partner {
    return PARTNERS[Math.floor(Math.random() * PARTNERS.length)];
}
