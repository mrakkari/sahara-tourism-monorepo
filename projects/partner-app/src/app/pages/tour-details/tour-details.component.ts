import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IMAGES } from '../../core/constants/images';

interface Tour {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  duration: string;
  minPeople: number;
  price: number;
  discount?: number;
  destination: string;
  keywords: string[];
  included: string[];
  notIncluded: string[];
  itinerary?: {
    day: string;
    title: string;
    description: string;
  }[];
  gallery?: string[];
}

@Component({
  selector: 'app-tour-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tour-details.component.html',
  styleUrls: ['./tour-details.component.scss']
})
export class TourDetailsComponent implements OnInit {
  tour: Tour | null = null;
  images = IMAGES;

  // AUTHENTIC DUNES INSOLITES TOURS - Matching your real offerings
  private toursData: Tour[] = [
    // ============================================
    // ACCOMMODATION TOURS
    // ============================================
    {
      id: 'Nuitée Camp DP',
      title: 'Nuitée au Campement',
      description: 'Nuit en tente confortable avec demi-pension',
      fullDescription: 'Passez une nuit inoubliable au cœur du Sahara dans notre campement Dunes Insolites à Sabria. Profitez du confort de nos tentes équipées, d\'un dîner traditionnel berbère et d\'un petit-déjeuner copieux. Une expérience authentique qui allie confort moderne et traditions du désert.',
      image: IMAGES.CAMP_NIGHT,
      duration: '1 Nuit',
      minPeople: 1,
      price: 85,
      destination: 'Campement Dunes Insolites, Sabria',
      keywords: ['campement', 'nuit', 'tente', 'demi-pension', 'confort'],
      included: [
        'Tente confortable avec literie de qualité',
        'Dîner traditionnel berbère',
        'Petit-déjeuner continental',
        'Thé à la menthe à l\'arrivée',
        'Accès aux sanitaires propres',
        'Électricité (panneaux solaires)',
        'Wi-Fi dans les espaces communs',
        'Observation des étoiles'
      ],
      notIncluded: [
        'Transport (peut être ajouté)',
        'Boissons alcoolisées',
        'Activités supplémentaires (quad, dromadaire)',
        'Pourboires'
      ],
      gallery: [
        IMAGES.CAMP_NIGHT,
        IMAGES.COMFORTABLE_TENTS,
        IMAGES.HERO_DESERT_NIGHT
      ]
    },
    {
      id: 'Bivouac',
      title: 'Nuit en Bivouac',
      description: 'Bivouac privé sous les étoiles du Sahara',
      fullDescription: 'Vivez l\'expérience ultime du désert avec notre bivouac privé. Dormez à la belle étoile ou sous une tente berbère traditionnelle, au cœur des dunes de Sabria. Profitez d\'un dîner aux chandelles, d\'une ambiance musicale berbère et d\'un ciel étoilé à couper le souffle. Une expérience romantique et authentique.',
      image: IMAGES.BIVOUAC_PRICE,
      duration: '1 Nuit',
      minPeople: 2,
      price: 120,
      destination: 'Dunes de Sabria',
      keywords: ['bivouac', 'étoiles', 'romantique', 'privé', 'authentique'],
      included: [
        'Installation bivouac privé dans les dunes',
        'Tente berbère ou couchage à la belle étoile',
        'Dîner traditionnel (couscous, tajine, pain de sable)',
        'Petit-déjeuner berbère',
        'Guide accompagnateur',
        'Musique traditionnelle',
        'Feu de camp',
        'Thé à la menthe illimité'
      ],
      notIncluded: [
        'Transport vers le site',
        'Boissons autres que thé/café',
        'Activités additionnelles'
      ],
      itinerary: [
        {
          day: 'Programme',
          title: 'Une nuit magique dans le désert',
          description: 'Arrivée en fin d\'après-midi. Installation du bivouac. Coucher de soleil sur les dunes. Dîner traditionnel. Soirée musicale. Observation des étoiles. Nuit en bivouac. Lever du soleil. Petit-déjeuner. Départ.'
        }
      ],
      gallery: [
        IMAGES.BIVOUAC_PRICE,
        IMAGES.BIVOUAC_SAFARI,
        IMAGES.HERO_STARRY_NIGHT
      ]
    },
    {
      id: 'Tente Suite DP',
      title: 'Tente Suite Luxe',
      description: 'Tente suite luxueuse avec demi-pension',
      fullDescription: 'Offrez-vous le summum du confort dans le désert avec notre Tente Suite Luxe. Spacieuse et élégamment décorée, elle dispose d\'un lit king-size, d\'un coin salon et d\'équipements premium. Profitez d\'une expérience 5 étoiles au cœur du Sahara avec demi-pension gastronomique.',
      image: IMAGES.LUXURY_TENT,
      duration: '1 Nuit',
      minPeople: 2,
      price: 150,
      destination: 'Campement Dunes Insolites, Sabria',
      keywords: ['luxe', 'suite', 'premium', 'confort', 'gastronomie'],
      included: [
        'Tente suite spacieuse (25m²)',
        'Lit king-size avec linge de qualité supérieure',
        'Coin salon privé',
        'Climatisation/chauffage',
        'Salle de bain privée avec eau chaude',
        'Dîner gastronomique',
        'Petit-déjeuner continental premium',
        'Service en chambre disponible',
        'Peignoirs et chaussons',
        'Produits de toilette bio'
      ],
      notIncluded: [
        'Transport',
        'Champagne et vins (carte disponible)',
        'Massages et spa (sur demande)',
        'Excursions'
      ],
      gallery: [
        IMAGES.LUXURY_TENT,
        IMAGES.COMFORTABLE_TENTS,
        IMAGES.CAMP_NIGHT
      ]
    },

    // ============================================
    // EXCURSION TOURS
    // ============================================
    {
      id: 'Coucher de Soleil',
      title: 'Coucher de Soleil',
      description: 'Excursion coucher de soleil dans les dunes',
      fullDescription: 'Assistez à l\'un des plus beaux spectacles de la nature : le coucher de soleil sur les dunes du Sahara. Notre excursion vous emmène au meilleur point de vue pour admirer le ciel qui s\'embrase de couleurs exceptionnelles. Thé à la menthe et pâtisseries inclus pour ce moment magique.',
      image: IMAGES.HERO_SUNSET,
      duration: '2-3 Heures',
      minPeople: 2,
      price: 60,
      destination: 'Dunes de Sabria',
      keywords: ['coucher de soleil', 'photo', 'romantique', 'panorama'],
      included: [
        'Transport 4x4 vers le meilleur spot',
        'Guide photographe',
        'Installation confortable (tapis, coussins)',
        'Thé à la menthe et pâtisseries traditionnelles',
        'Session photo professionnelle',
        'Eau minérale'
      ],
      notIncluded: [
        'Équipement photo personnel',
        'Dîner (peut être ajouté)'
      ],
      gallery: [
        IMAGES.HERO_SUNSET,
        IMAGES.HERO_DUNES_SUNSET,
        IMAGES.DESERT_SUNSET
      ]
    },
    {
      id: 'Excursion Dromadaire',
      title: 'Balade en Dromadaire',
      description: 'Balade authentique en dromadaire dans le désert',
      fullDescription: 'Revivez l\'expérience des caravaniers du désert lors d\'une balade authentique en dromadaire. Accompagnés de guides expérimentés, traversez les dunes majestueuses de Sabria au rythme tranquille de ces animaux emblématiques du Sahara. Une expérience incontournable pour découvrir le désert autrement.',
      image: IMAGES.CAMEL_EXCURSION,
      duration: '1-2 Heures',
      minPeople: 1,
      price: 70,
      destination: 'Dunes de Sabria',
      keywords: ['dromadaire', 'chameau', 'balade', 'traditionnel', 'découverte'],
      included: [
        'Balade en dromadaire (1h ou 2h au choix)',
        'Guide chamelier expérimenté',
        'Chèche traditionnel offert',
        'Photos souvenirs',
        'Thé à la menthe au retour',
        'Assurance'
      ],
      notIncluded: [
        'Transport vers le départ (si nécessaire)',
        'Pourboires pour le chamelier'
      ],
      itinerary: [
        {
          day: 'Programme',
          title: 'Aventure caravanière',
          description: 'Accueil et présentation des dromadaires. Instructions de sécurité. Départ en caravane à travers les dunes. Arrêt photo panoramique. Suite de la balade. Retour au campement. Thé à la menthe de bienvenue.'
        }
      ],
      gallery: [
        IMAGES.CAMEL_EXCURSION,
        IMAGES.HERO_CAMEL_CARAVAN,
        IMAGES.CAMEL_RIDE
      ]
    },
    {
      id: 'Dîner Bédouin',
      title: 'Dîner Bédouin',
      description: 'Dîner traditionnel bédouin sous les étoiles',
      fullDescription: 'Savourez un festin bédouin authentique sous un ciel étoilé exceptionnel. Notre dîner traditionnel vous fait découvrir les saveurs ancestrales du désert : couscous, tajine, pain de sable cuit sous la braise, viandes grillées et pâtisseries au miel. Accompagné de musique traditionnelle et de danses berbères.',
      image: IMAGES.BEDOUIN_DINNER,
      duration: '3-4 Heures',
      minPeople: 2,
      price: 45,
      destination: 'Campement Dunes Insolites',
      keywords: ['dîner', 'gastronomie', 'bédouin', 'spectacle', 'musique'],
      included: [
        'Dîner complet 5 plats',
        'Couscous traditionnel',
        'Tajine d\'agneau ou poulet',
        'Pain de sable (préparation sur place)',
        'Grillades variées',
        'Pâtisseries et fruits',
        'Thé à la menthe illimité',
        'Spectacle de musique et danse',
        'Ambiance feu de camp'
      ],
      notIncluded: [
        'Transport (disponible en supplément)',
        'Boissons alcoolisées',
        'Vêtements traditionnels (location possible)'
      ],
      gallery: [
        IMAGES.BEDOUIN_DINNER,
        IMAGES.TRADITIONAL_BREAD,
        IMAGES.SUNSET_TEA
      ]
    },

    // ============================================
    // CIRCUIT TOURS
    // ============================================
    {
      id: 'Circuit 2 Jours',
      title: 'Circuit Désert 2 Jours',
      description: 'Circuit 2 jours/1 nuit avec bivouac',
      fullDescription: 'Explorez le Sahara tunisien lors d\'un circuit complet de 2 jours. De Douz aux dunes de Sabria, en passant par des oasis cachées et des villages berbères, découvrez la richesse du désert. Nuit en bivouac sous les étoiles, repas traditionnels et guide francophone expérimenté inclus.',
      image: IMAGES.HERO_DESERT_TRIP,
      duration: '2 Jours / 1 Nuit',
      minPeople: 2,
      price: 180,
      destination: 'Sahara Tunisien',
      keywords: ['circuit', 'découverte', 'aventure', '2 jours', 'complet'],
      included: [
        'Transport 4x4 tout le circuit',
        'Guide francophone',
        ' 1 nuit en bivouac',
        'Tous les repas (2 déj, 1 dîner, 1 p-dej)',
        'Visite d\'oasis et villages berbères',
        'Balade en dromadaire (1h)',
        'Eau minérale',
        'Carburant'
      ],
      notIncluded: [
        'Hébergement veille du départ',
        'Boissons autres',
        'Entrées sites touristiques (si applicable)',
        'Pourboires'
      ],
      itinerary: [
        {
          day: 'Jour 1',
          title: 'Douz - Villages Berbères - Bivouac',
          description: 'Départ matinal de Douz. Traversée du désert en 4x4. Visite d\'un village berbère authentique. Déjeuner traditionnel. Continuation vers les grandes dunes. Installation du bivouac. Balade en dromadaire au coucher du soleil. Dîner et nuit sous les étoiles.'
        },
        {
          day: 'Jour 2',
          title: 'Lever du soleil - Oasis - Retour',
          description: 'Réveil pour le lever du soleil. Petit-déjeuner berbère. Visite d\'une oasis cachée. Temps libre pour photos. Déjeuner pique-nique. Retour vers le point de départ via paysages spectaculaires. Arrivée en fin d\'après-midi.'
        }
      ],
      gallery: [
        IMAGES.HERO_DESERT_TRIP,
        IMAGES.BIVOUAC_SAFARI,
        IMAGES.DUNES_LANDSCAPE
      ]
    },
    {
      id: 'Tataouine Chenini',
      title: 'Excursion Tataouine & Chenini',
      description: 'Découverte des villages berbères fortifiés',
      fullDescription: 'Partez à la découverte des villages berbères troglodytes de Tataouine et Chenini, véritables bijoux architecturaux du sud tunisien. Explorez les ksour (greniers fortifiés), visitez des habitations troglodytes, et imprégnez-vous de l\'histoire millénaire berbère. Déjeuner traditionnel inclus.',
      image: IMAGES.TATAOUINE_CHENINI,
      duration: '1 Journée',
      minPeople: 2,
      price: 90,
      destination: 'Tataouine & Chenini',
      keywords: ['culture', 'berbère', 'histoire', 'architecture', 'tataouine'],
      included: [
        'Transport climatisé aller-retour',
        'Guide francophone spécialisé',
        'Visite de Tataouine (marché, ksar)',
        'Visite de Chenini (village troglodyte)',
        'Visite d\'une maison berbère',
        'Déjeuner berbère traditionnel',
        'Thé à la menthe',
        'Entrées aux sites'
      ],
      notIncluded: [
        'Boissons pendant le déjeuner',
        'Achats personnels au marché',
        'Pourboires'
      ],
      itinerary: [
        {
          day: 'Programme journée',
          title: 'Sur les traces des Berbères',
          description: '08h00 Départ. 10h00 Arrivée Tataouine, visite du marché et ksar. 12h30 Route vers Chenini. 13h00 Déjeuner berbère. 14h30 Visite village troglodyte. 16h00 Temps libre et photos. 17h00 Retour. 19h00 Arrivée.'
        }
      ],
      gallery: [
        IMAGES.TATAOUINE_CHENINI,
        IMAGES.CIRCUIT_TUNISIA
      ]
    },
    {
      id: 'Ksar Ghilane',
      title: 'Journée Ksar Ghilane',
      description: 'Excursion aux sources chaudes du désert',
      fullDescription: 'Découvrez Ksar Ghilane, l\'oasis aux sources d\'eau chaude naturelle au cœur du Sahara. Baignez-vous dans les eaux thermales bienfaisantes, explorez le fort romain, déjeunez dans un restaurant traditionnel et profitez d\'une balade en dromadaire. Une journée complète de détente et découverte.',
      image: IMAGES.KSAR_GHILANE,
      duration: '1 Journée',
      minPeople: 2,
      price: 80,
      destination: 'Ksar Ghilane',
      keywords: ['oasis', 'sources chaudes', 'baignade', 'détente', 'nature'],
      included: [
        'Transport 4x4 aller-retour',
        'Guide accompagnateur',
        'Accès aux sources chaudes',
        'Balade en dromadaire (30 min)',
        'Déjeuner au restaurant de l\'oasis',
        'Visite du fort romain',
        'Eau minérale',
        'Temps libre baignade'
      ],
      notIncluded: [
        'Maillot de bain (à prévoir)',
        'Serviette de bain',
        'Boissons au restaurant',
        'Activités supplémentaires (quad disponible sur place)'
      ],
      itinerary: [
        {
          day: 'Programme',
          title: 'Oasis et détente',
          description: 'Départ matinal. Traversée du désert (2h30). Arrivée à Ksar Ghilane. Baignade sources chaudes. Déjeuner à l\'oasis. Balade en dromadaire. Visite fort romain. Temps libre. Retour en fin d\'après-midi.'
        }
      ],
      gallery: [
        IMAGES.KSAR_GHILANE,
        IMAGES.CAMEL_EXCURSION
      ]
    },
    {
      id: 'Circuit 7 Jours',
      title: 'Aventure 7 Jours Sahara',
      description: 'Circuit complet du désert tunisien',
      fullDescription: 'Le grand tour du Sahara tunisien ! 7 jours d\'aventure à travers les plus beaux sites du sud : Tozeur, Douz, Matmata, Tataouine, Ksar Ghilane et les dunes de Sabria. Alternance entre hôtels confortables et nuits en bivouac. Une immersion totale dans la culture et les paysages du désert.',
      image: IMAGES.CIRCUIT_7_DAYS,
      duration: '7 Jours / 6 Nuits',
      minPeople: 2,
      price: 700,
      discount: 15,
      destination: 'Sud Tunisien Complet',
      keywords: ['circuit', 'complet', '7 jours', 'aventure', 'découverte'],
      included: [
        'Transport 4x4 tout le circuit',
        'Guide francophone expert',
        '3 nuits en hôtels 3-4*',
        '3 nuits en bivouac',
        'Tous les repas',
        'Visites guidées tous les sites',
        'Balades en dromadaire',
        'Entrées sites touristiques',
        'Eau minérale',
        'Carburant'
      ],
      notIncluded: [
        'Vol international',
        'Assurance voyage',
        'Boissons alcoolisées',
        'Dépenses personnelles',
        'Pourboires'
      ],
      itinerary: [
        {
          day: 'Jour 1',
          title: 'Arrivée - Tozeur',
          description: 'Accueil aéroport. Transfert Tozeur. Visite palmeraie et vieille ville. Installation hôtel. Dîner. Nuit Tozeur.'
        },
        {
          day: 'Jour 2',
          title: 'Chebika - Tamerza - Mides',
          description: 'Excursion oasis de montagne. Cascades. Décors Star Wars. Déjeuner berbère. Retour Tozeur. Nuit hôtel.'
        },
        {
          day: 'Jour 3',
          title: 'Douz - Désert',
          description: 'Route vers Douz. Marché. Départ vers dunes. Installation bivouac. Dromadaire coucher soleil. Dîner feu de camp. Nuit bivouac.'
        },
        {
          day: 'Jour 4',
          title: 'Ksar Ghilane',
          description: 'Lever soleil. Route Ksar Ghilane. Sources chaudes. Déjeuner oasis. Fort romain. Bivouac. Nuit sous étoiles.'
        },
        {
          day: 'Jour 5',
          title: 'Matmata - Tataouine',
          description: 'Villages troglodytes. Déjeuner berbère. Ksour. Tataouine. Hôtel. Nuit confort.'
        },
        {
          day: 'Jour 6',
          title: 'Chenini - Sabria',
          description: 'Village fortifié Chenini. Route grandes dunes Sabria. Installation campement Dunes Insolites. Coucher soleil. Dîner spectacle. Nuit tente.'
        },
        {
          day: 'Jour 7',
          title: 'Sabria - Départ',
          description: 'Lever soleil dunes. Petit-déjeuner. Temps libre. Route retour. Transfert aéroport. Fin du circuit.'
        }
      ],
      gallery: [
        IMAGES.CIRCUIT_7_DAYS,
        IMAGES.CIRCUIT_TUNISIA,
        IMAGES.BIVOUAC_SAFARI,
        IMAGES.TATAOUINE_CHENINI,
        IMAGES.KSAR_GHILANE
      ]
    },

    // ============================================
    // SPECIAL EVENT TOURS
    // ============================================
    {
      id: 'Demi Pension Reveillon',
      title: 'Réveillon au Camp',
      description: 'Célébrez le Nouvel An dans le désert',
      fullDescription: 'Vivez un réveillon du Nouvel An unique et inoubliable au cœur du Sahara tunisien. Célébrez 2025 dans notre campement Dunes Insolites avec un menu gastronomique, champagne, spectacle traditionnel et feu d\'artifice. Une soirée magique sous les étoiles pour commencer l\'année en beauté.',
      image: IMAGES.NEW_YEAR_EVENT,
      duration: '1 Nuit (31 déc)',
      minPeople: 2,
      price: 180,
      destination: 'Campement Dunes Insolites',
      keywords: ['réveillon', 'nouvel an', 'fête', 'célébration', 'spécial'],
      included: [
        'Tente confortable premium',
        'Cocktail de bienvenue au champagne',
        'Dîner gastronomique 6 plats',
        'Vins sélectionnés',
        'Champagne minuit',
        'Spectacle musical et danse',
        'Feu d\'artifice (si autorisé)',
        'Petit-déjeuner du jour de l\'an',
        'Animation DJ'
      ],
      notIncluded: [
        'Transport (forfait disponible)',
        'Bar premium (carte disponible)',
        'Upgrade suite (+70 TND)'
      ],
      gallery: [
        IMAGES.NEW_YEAR_EVENT,
        IMAGES.BEDOUIN_DINNER,
        IMAGES.CAMP_NIGHT
      ]
    },
    {
      id: 'Demi Pension SUITE Reveillon',
      title: 'Réveillon Suite Luxe',
      description: 'Réveillon VIP en tente suite premium',
      fullDescription: 'L\'expérience réveillon ultime ! Célébrez le Nouvel An dans notre Tente Suite Luxe avec service VIP. Menu gastronomique étoilé, champagne premium, service en chambre, et tous les privilèges d\'un séjour d\'exception. Limitée à quelques suites pour une expérience exclusive.',
      image: IMAGES.NEW_YEAR_EVENT,
      duration: '1 Nuit (31 déc)',
      minPeople: 2,
      price: 250,
      destination: 'Campement Dunes Insolites',
      keywords: ['réveillon', 'luxe', 'vip', 'suite', 'premium', 'exclusif'],
      included: [
        'Tente Suite Luxe (25m²)',
        'Champagne Moët & Chandon à l\'arrivée',
        'Canapés et amuse-bouches en chambre',
        'Dîner gastronomique 7 plats menu chef',
        'Accords mets-vins premium',
        'Service VIP dédié',
        'Place réservée spectacle',
        'Cadeaux de minuit',
        'Petit-déjeuner en suite',
        'Late check-out 14h'
      ],
      notIncluded: [
        'Transport VIP (disponible)',
        'Champagne Cristal (supplément)',
        'Massage duo (sur réservation)'
      ],
      gallery: [
        IMAGES.NEW_YEAR_EVENT,
        IMAGES.LUXURY_TENT,
        IMAGES.COMFORTABLE_TENTS
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const tourId = params['id'];
      this.tour = this.toursData.find(t => t.id === tourId) || null;
      
      if (!this.tour) {
        // If tour not found, redirect to home
        this.router.navigate(['/']);
      }
    });
  }

  getFinalPrice(): number {
    if (!this.tour) return 0;
    if (this.tour.discount) {
      return this.tour.price * (1 - this.tour.discount / 100);
    }
    return this.tour.price;
  }

  bookNow() {
    if (this.tour) {
      this.router.navigate(['/create-reservation'], {
        queryParams: { tour: this.tour.id }
      });
    }
  }
}