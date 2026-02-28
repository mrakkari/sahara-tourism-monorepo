import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLangSubject = new BehaviorSubject<string>('fr');
    public currentLang$ = this.currentLangSubject.asObservable();

    private translations: any = {
        'en': {
            'nav.home': 'Home',
            'nav.tours': 'Our Tours',
            'nav.about': 'About Us',
            'nav.contact': 'Contact',
            'nav.book': 'Book Now',
            'hero.title': 'Experience the Magic of the Sahara',
            'hero.subtitle': 'Luxury camping and authentic desert adventures in Tunisia',
            'tours.title': 'Our Desert Tours',
            'tours.subtitle': 'Discover our adventures in the heart of the Tunisian Sahara',
            'tours.no_results': 'No tours found in this category.',
            'why.title': 'Why Choose Us?',
            'footer.rights': 'All rights reserved.',
            'btn.details': 'View Details',
            'btn.book': 'Book This Tour',
            'filter.all': 'All'
        },
        'fr': {
            'nav.home': 'Accueil',
            'nav.tours': 'Nos Excursions',
            'nav.about': 'À Propos',
            'nav.contact': 'Contact',
            'nav.book': 'Réserver',
            'hero.title': 'Vivez la Magie du Sahara',
            'hero.subtitle': 'Camping de luxe et aventures authentiques dans le désert tunisien',
            'tours.title': 'Nos Excursions Désert',
            'tours.subtitle': 'Découvrez nos aventures au cœur du Sahara tunisien',
            'tours.no_results': 'Aucun tour trouvé dans cette catégorie.',
            'why.title': 'Pourquoi Nous Choisir ?',
            'footer.rights': 'Tous droits réservés.',
            'btn.details': 'Voir Détails',
            'btn.book': 'Réserver',
            'filter.all': 'Tous'
        }
    };

    constructor() { }

    setLanguage(lang: string) {
        if (this.translations[lang]) {
            this.currentLangSubject.next(lang);
        }
    }

    translate(key: string): string {
        const lang = this.currentLangSubject.value;
        return this.translations[lang][key] || key;
    }
}
