// src/app/core/services/language.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'FR' | 'EN';

interface Translations {
  [key: string]: {
    FR: string;
    EN: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>('FR');
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();

  private translations: Translations = {
    // Header
    'header.home': { FR: 'Accueil', EN: 'Home' },
    'header.about': { FR: 'À propos', EN: 'About' },
    'header.tours': { FR: 'Tours', EN: 'Tours' },
    'header.gallery': { FR: 'Galerie', EN: 'Gallery' },
    'header.contact': { FR: 'Contact', EN: 'Contact' },
    'header.book': { FR: 'Réserver', EN: 'Book Now' },
    'header.notifications': { FR: 'Notifications', EN: 'Notifications' },
    'header.markAllRead': { FR: 'Tout marquer lu', EN: 'Mark all as read' },
    'header.noNotifications': { FR: 'Aucune notification', EN: 'No notifications' },

    // Home Page - Hero Section
    'home.hero.badge': { FR: 'L\'Aventure Saharienne Ultime', EN: 'The Ultimate Saharan Adventure' },
    'home.hero.title': { FR: 'Évadez-vous dans', EN: 'Escape to' },
    'home.hero.subtitle': { FR: 'L\'Infini du Désert', EN: 'The Infinite Desert' },
    'home.hero.description': { 
      FR: 'Découvrez la magie du Sahara tunisien avec des expériences de bivouac de luxe et des excursions sur mesure.', 
      EN: 'Discover the magic of the Tunisian Sahara with luxury camping experiences and custom excursions.' 
    },
    'home.hero.bookNow': { FR: 'Réserver Maintenant', EN: 'Book Now' },
    'home.hero.ourTours': { FR: 'nos Excursions', EN: 'Our Tours' },
    
    // Home Page - Search Section
    'home.search.keywords': { FR: 'Mots-clés', EN: 'Keywords' },
    'home.search.destination': { FR: 'Destination', EN: 'Destination' },
    'home.search.search': { FR: 'Rechercher', EN: 'Search' },
    
    // Home Page - Tours Section
    'home.tours.title': { FR: 'Nos Meilleures Offres', EN: 'Our Best Offers' },
    'home.tours.subtitle': { FR: 'Sélectionnées pour vous faire vivre le rêve saharien', EN: 'Selected to make you live the Saharan dream' },
    'home.tours.resetSearch': { FR: 'Réinitialiser la recherche', EN: 'Reset search' },
    'home.tours.viewDetails': { FR: 'Voir détails', EN: 'View details' },
    'home.tours.noResults': { FR: 'Aucun résultat trouvé', EN: 'No results found' },
    'home.tours.modifySearch': { FR: 'Essayez de modifier vos critères de recherche', EN: 'Try modifying your search criteria' },
    'home.tours.viewAll': { FR: 'Voir toutes les offres', EN: 'View all offers' },
    
    // Home Page - Activities Section
    'home.activities.title': { FR: 'Expériences Uniques', EN: 'Unique Experiences' },
    'home.activities.explore': { FR: 'Explorer', EN: 'Explore' },

    // Home Page - Featured Tours (for component data)
    'home.tour.bivouac.title': { FR: 'Bivouac Royal', EN: 'Royal Bivouac' },
    'home.tour.bivouac.description': { FR: 'Nuit sous les étoiles avec tout le confort moderne.', EN: 'Night under the stars with all modern comforts.' },
    'home.tour.quad.title': { FR: 'Quad Adrénaline', EN: 'Adrenaline Quad' },
    'home.tour.quad.description': { FR: 'Domptez les dunes lors d\'une session intense.', EN: 'Conquer the dunes during an intense session.' },
    'home.tour.legend.title': { FR: 'Légende Berbère', EN: 'Berber Legend' },
    'home.tour.legend.description': { FR: 'Dîner spectacle et culture locale.', EN: 'Dinner show and local culture.' },
    'home.tour.duration.days': { FR: 'Jours', EN: 'Days' },
    'home.tour.duration.hours': { FR: 'Heures', EN: 'Hours' },
    'home.tour.duration.evening': { FR: 'Soirée', EN: 'Evening' },

    // Home Page - Activity Names
    'home.activity.4x4': { FR: '4x4 Extrême', EN: 'Extreme 4x4' },
    'home.activity.camel': { FR: 'Balade Dromadaire', EN: 'Camel Ride' },
    'home.activity.sandboarding': { FR: 'Sandboarding', EN: 'Sandboarding' },

    // Tours Page
    'tours.title': { FR: 'Nos Excursions', EN: 'Our Tours' },
    'tours.subtitle': { FR: 'Partez à la découverte des plus beaux circuits touristiques en Tunisie', EN: 'Discover the most beautiful tourist circuits in Tunisia' },
    'tours.no_results': { FR: 'Aucun tour trouvé', EN: 'No tours found' },
    'filter.all': { FR: 'Tous', EN: 'All' },
    'btn.book': { FR: 'Réserver', EN: 'Book' },

    // Reservation Form
    'reservation.title': { FR: 'Créer votre Réservation', EN: 'Create Your Reservation' },
    'reservation.subtitle': { FR: 'Configurez votre aventure sur mesure en quelques étapes.', EN: 'Configure your custom adventure in a few steps.' },
    'reservation.back': { FR: 'Retour', EN: 'Back' },
    'reservation.step1': { FR: 'Choisissez votre expérience', EN: 'Choose your experience' },
    'reservation.step2': { FR: 'Dates & Options', EN: 'Dates & Options' },
    'reservation.step3': { FR: 'Détails des Voyageurs', EN: 'Travelers Details' },
    'reservation.step4': { FR: 'Confirmation', EN: 'Confirmation' },
    'reservation.adults': { FR: 'Adultes', EN: 'Adults' },
    'reservation.children': { FR: 'Enfants', EN: 'Children' },
    'reservation.arrival': { FR: 'Arrivée', EN: 'Check-in' },
    'reservation.departure': { FR: 'Départ', EN: 'Check-out' },
    'reservation.duration': { FR: 'Durée du séjour', EN: 'Stay duration' },
    'reservation.nights': { FR: 'Nuits', EN: 'Nights' },
    'reservation.extras': { FR: 'Options Supplémentaires', EN: 'Additional Options' },
    'reservation.transfer': { FR: 'Transfert Aéroport', EN: 'Airport Transfer' },
    'reservation.mealUpgrade': { FR: 'Repas Royal', EN: 'Royal Meal' },
    'reservation.quad': { FR: 'Sortie Quad 1h', EN: 'Quad Ride 1h' },
    'reservation.responsibleName': { FR: 'Responsable de réservation (Nom complet)', EN: 'Booking Manager (Full Name)' },
    'reservation.guestList': { FR: 'Liste des invités (Optionnel)', EN: 'Guest List (Optional)' },
    'reservation.addTraveler': { FR: 'Ajouter un voyageur', EN: 'Add a traveler' },
    'reservation.specialRequests': { FR: 'Demandes Spéciales', EN: 'Special Requests' },
    'reservation.specialRequestsPlaceholder': { FR: 'Régime alimentaire, anniversaire, etc.', EN: 'Dietary requirements, birthday, etc.' },
    'reservation.promoCode': { FR: 'Code Promo', EN: 'Promo Code' },
    'reservation.apply': { FR: 'Appliquer', EN: 'Apply' },
    'reservation.promoSuccess': { FR: '10% de réduction appliqué!', EN: '10% discount applied!' },
    'reservation.promoError': { FR: 'Code promo invalide', EN: 'Invalid promo code' },
    'reservation.terms': { FR: 'J\'accepte les conditions générales de vente et la politique d\'annulation.', EN: 'I accept the terms and conditions and cancellation policy.' },
    'reservation.continue': { FR: 'Continuer', EN: 'Continue' },
    'reservation.confirm': { FR: 'Confirmer la Réservation', EN: 'Confirm Reservation' },
    'reservation.validating': { FR: 'Validation...', EN: 'Validating...' },
    'reservation.yourBooking': { FR: 'Votre Réservation', EN: 'Your Booking' },
    'reservation.travelers': { FR: 'Voyageurs', EN: 'Travelers' },
    'reservation.dates': { FR: 'Dates', EN: 'Dates' },
    'reservation.base': { FR: 'Base', EN: 'Base' },
    'reservation.options': { FR: 'Options', EN: 'Options' },
    'reservation.discount': { FR: 'Remise', EN: 'Discount' },
    'reservation.total': { FR: 'Total Estimé', EN: 'Estimated Total' },
    'reservation.securePayment': { FR: 'Paiement sécurisé lors de la confirmation', EN: 'Secure payment upon confirmation' },

    // Footer
    'footer.description': { 
      FR: 'Découvrez Dunes Insolites À Sabria, Tunisie Le Confort, La Cuisine Savoureuse, Les Activités Palpitantes, Et Bivouacs Privés Sous Les Étoiles. Accessible En Voiture, Avec Réductions Pour Les Enfants.', 
      EN: 'Discover Dunes Insolites in Sabria, Tunisia. Comfort, Delicious Cuisine, Exciting Activities, And Private Bivouacs Under The Stars. Accessible By Car, With Children Discounts.' 
    },
    'footer.information': { FR: 'Informations', EN: 'Information' },
    'footer.generalInfo': { FR: 'Infos Générale', EN: 'General Info' },
    'footer.usefulLinks': { FR: 'Liens Utiles', EN: 'Useful Links' },
    'footer.copyright': { FR: '© COPYRIGHT', EN: '© COPYRIGHT' },
    'footer.poweredBy': { FR: 'POWERED BY', EN: 'POWERED BY' },

    // Common
    'common.per_person': { FR: '/ pers', EN: '/ person' },
    'common.adult': { FR: 'Adulte', EN: 'Adult' },
    'common.child': { FR: 'Enfant', EN: 'Child' },
    'common.loading': { FR: 'Chargement...', EN: 'Loading...' },
    'common.error': { FR: 'Erreur', EN: 'Error' },
    'common.success': { FR: 'Succès', EN: 'Success' },
  };

  constructor() {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'FR' || savedLang === 'EN')) {
      this.currentLanguageSubject.next(savedLang);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: Language): void {
    this.currentLanguageSubject.next(lang);
    localStorage.setItem('language', lang);
  }

  toggleLanguage(): void {
    const newLang: Language = this.getCurrentLanguage() === 'FR' ? 'EN' : 'FR';
    this.setLanguage(newLang);
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[this.getCurrentLanguage()];
  }

  // Helper method to get instant translation without observable
  instant(key: string): string {
    return this.translate(key);
  }
}