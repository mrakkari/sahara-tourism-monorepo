import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';
import { TranslatePipe } from '../../core/services/translate.pipe';

interface PromotionalCard {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser = { name: 'Kantaoui Travel' };
  currentHeroImage = 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&q=80';

  // Promotional cards (from mock data service)
  promotionalCards: PromotionalCard[] = [];

  // Quick action buttons
  quickActions: QuickAction[] = [
    {
      title: 'Nouvelle Réservation',
      description: 'Créer une nouvelle réservation pour vos clients',
      icon: '📝',
      route: '/create-reservation',
      color: '#3B82F6'
    },
    {
      title: 'Mes Réservations',
      description: 'Consulter l\'historique de toutes vos réservations',
      icon: '📋',
      route: '/historique',
      color: '#10B981'
    },
    {
      title: 'Mes Factures',
      description: 'Voir et télécharger vos factures',
      icon: '💶',
      route: '/factures',
      color: '#F59E0B'
    },
    {
      title: 'Statistiques',
      description: 'Analyser vos performances et statistiques',
      icon: '📊',
      route: '/statistiques',
      color: '#8B5CF6'
    }
  ];

  constructor(private mockDataService: MockDataService) { }

  ngOnInit(): void {
    this.loadPromotionalContent();
  }

  loadPromotionalContent(): void {
    this.promotionalCards = this.mockDataService.getPromotionalContent();
  }
}