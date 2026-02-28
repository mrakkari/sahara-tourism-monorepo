/**
 * Business Data Constants
 * Real partner names, tour types, and source options for the reservation system
 */

export const PARTNER_NAMES = [
    'Bonheur voyage',
    'costa travel',
    'Desert Rose service',
    'ste Nasri tour travel',
    'Travel Sun',
    'Rawia Travel',
    'Hannon travel',
    'Djerba activities dreams',
    'Inventa tourisme',
    'lotos voyages',
    'kantaoui travel',
    'Hadrumétre voyage',
    'Touil travel',
    'siroko',
    'Tunisian Colors travel'
] as const;

export const TOUR_TYPES = [
    'Bivouac',
    'Demi Pension SUITE Reveillon',
    'Demi Pension Reveillon',
    'Nuitée Camp DP',
    'Sortie 1h30 4x4',
    'Tente Suite DP',
    'tente suite adulte',
    'touzeur _ tataouine_ matmata'
] as const;

export const RESERVATION_SOURCES = [
    'Airbnb',
    'GetYourGuide',
    'Booking',
    'TripAdvisor',
    'Email',
    'App',
    'Partenaire'
] as const;

// Type exports for type safety
export type PartnerName = typeof PARTNER_NAMES[number];
export type TourType = typeof TOUR_TYPES[number];
export type ReservationSource = typeof RESERVATION_SOURCES[number];

// Sample passenger names for generating realistic data
export const SAMPLE_PASSENGER_NAMES = [
    'Ahmed Ben Ali',
    'Fatima Trabelsi',
    'Mohamed Gharbi',
    'Leila Hammami',
    'Karim Mansouri',
    'Samia Jebali',
    'Youssef Bouazizi',
    'Amira Kraiem',
    'Mehdi Cherni',
    'Nadia Sahli',
    'Sofiane Bouzid',
    'Rania Abidi',
    'Omar Slimani',
    'Ines Mabrouk',
    'Tarak Ouali'
] as const;
