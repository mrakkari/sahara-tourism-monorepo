import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IMAGES } from '../../constants/images';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  logo = IMAGES.LOGO;
  currentYear = new Date().getFullYear();

  informationLinks = [
    { label: 'Qui Sommes Nous?', route: '/about' },
    { label: 'Plus D\'infos', route: '/tours' },
    { label: 'Blog Desert', route: '/blog/desert' },
    { label: 'Blog Campement', route: '/blog/campement' },
    { label: 'Photos', route: '/gallery' },
    { label: 'Avis', route: '/reviews' },
    { label: 'Evenement', route: '/events' }
  ];

  infosGeneraleLinks = [
    { label: 'Soirées Sous Les Étoiles', route: '/tours?activity=starlight' },
    { label: 'Dîner Bédouin', route: '/tours?activity=bedouin-dinner' },
    { label: 'Excursions En Quad', route: '/tours?activity=quad' },
    { label: 'Sandboarding', route: '/tours?activity=sandboarding' },
    { label: 'Cuisine', route: '/tours?activity=cuisine' },
    { label: 'Les Excursions En 4x4', route: '/tours?activity=4x4' },
    { label: 'Météo Dans Le Désert', route: '/weather' },
    { label: 'Emplacement Sahara', route: '/location' }
  ];

  liensUtilesLinks = [
    { label: 'Services', route: '/services' },
    { label: 'Besoin D\'aide', route: '/help' },
    { label: 'Termes Et Conditions', route: '/terms' },
    { label: 'Politiques', route: '/policies' }
  ];

  socialMediaLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://www.facebook.com/dunesinsolites', color: '#1877F2' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://www.instagram.com/dunesinsolites', color: '#E4405F' },
    { name: 'TikTok', icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@dunesinsolites', color: '#000000' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://www.youtube.com/@dunesinsolites', color: '#FF0000' },
    { name: 'Pinterest', icon: 'fab fa-pinterest-p', url: 'https://www.pinterest.com/dunesinsolites', color: '#E60023' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://www.linkedin.com/company/dunesinsolites', color: '#0A66C2' },
    { name: 'Twitter', icon: 'fab fa-x-twitter', url: 'https://twitter.com/dunesinsolites', color: '#000000' },
    { name: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/21627391501', color: '#25D366' },
    { name: 'TripAdvisor', icon: 'fab fa-tripadvisor', url: 'https://www.tripadvisor.com/dunesinsolites', color: '#00AF87' },
    { name: 'Airbnb', icon: 'fab fa-airbnb', url: 'https://www.airbnb.com/dunesinsolites', color: '#FF5A5F' },
    { name: 'Get Your Guide', icon: 'fas fa-map-marked-alt', url: 'https://www.getyourguide.com/dunesinsolites', color: '#FF6700' },
    { name: 'Booking.com', icon: 'fas fa-bed', url: 'https://www.booking.com/dunesinsolites', color: '#003580' }
  ];
}