/**
 * Realistic Tunisian Tourism Group Names
 * Mix of tour company groups, family names, cultural missions, and expedition teams
 */

export const GROUP_NAMES: string[] = [
    'Groupe Sahara Express',
    'Équipe Ben Salah',
    'Groupe Méditerranée Tours',
    'Délégation Kairouan',
    'Groupe Atlas Adventures',
    'Mission Culturelle Djerba',
    'Expédition Désert Tunisien',
    'Groupe Famille Hammami',
    'Circuit Oasis du Sud',
    'Groupe Découverte Tunisie',
    'Équipe Carthage Voyages',
    'Groupe Famille Trabelsi',
    'Délégation Sousse Tourisme',
    'Groupe Étoile du Sahara',
    'Mission Scolaire Sfax',
    'Groupe Ben Abdallah',
    'Équipe Désert d\'Or',
    'Groupe Famille Gharbi',
    'Circuit Ksour et Dunes',
    'Groupe Soleil Tunisien',
    'Délégation Monastir',
    'Équipe Oasis du Sud',
    'Groupe Famille Jebali',
    'Mission Touristique Gabès',
    'Groupe Nomades du Sahara',
    'Équipe Perles du Désert',
    'Groupe Famille Bouzid',
    'Circuit Grand Sud',
    'Groupe Aventure Berbère',
    'Délégation Tozeur'
];

/**
 * Helper function to get random group name
 */
export function getRandomGroupName(): string {
    return GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)];
}
