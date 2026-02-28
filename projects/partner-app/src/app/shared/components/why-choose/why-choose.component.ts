import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TrustFeature {
  title: string;
  description: string;
  metric?: string;
}

@Component({
  selector: 'app-why-choose',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="why-choose-section">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="section-title">Pourquoi Voyager Avec Nous ?</h2>
          <p class="subtitle">Votre sécurité et satisfaction sont notre priorité absolue</p>
        </div>

        <!-- Trust Badges -->
        <div class="trust-badges">
          <div class="badge-item">
            <div class="badge-icon">✓</div>
            <div class="badge-text">
              <strong>Guides Certifiés</strong>
              <span>Locaux & Expérimentés</span>
            </div>
          </div>
          <div class="badge-item">
            <div class="badge-icon">★</div>
            <div class="badge-text">
              <strong>4.9/5 sur TripAdvisor</strong>
              <span>+2,000 Avis Vérifiés</span>
            </div>
          </div>
          <div class="badge-item">
            <div class="badge-icon">🛡️</div>
            <div class="badge-text">
              <strong>Assurance Complète</strong>
              <span>Tous Nos Circuits</span>
            </div>
          </div>
          <div class="badge-item">
            <div class="badge-icon">🌍</div>
            <div class="badge-text">
              <strong>Tourisme Durable</strong>
              <span>Éco-Responsable</span>
            </div>
          </div>
        </div>

        <!-- Main Features Grid -->
        <div class="features-grid">
          <div *ngFor="let feature of features" class="feature-card">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <div class="feature-metric" *ngIf="feature.metric">{{ feature.metric }}</div>
          </div>
        </div>

        <!-- Statistics Bar -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">15+</div>
            <div class="stat-label">Années d'Expérience</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">10,000+</div>
            <div class="stat-label">Voyageurs Satisfaits</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">98%</div>
            <div class="stat-label">Taux de Satisfaction</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Support Client</div>
          </div>
        </div>

        <!-- Safety & Quality Section -->
        <div class="quality-section">
          <h3>Nos Engagements Qualité & Sécurité</h3>
          <div class="quality-grid">
            <div class="quality-item">
              <strong>Véhicules Modernes</strong>
              <p>4x4 climatisés, entretenus régulièrement et assurés selon normes internationales</p>
            </div>
            <div class="quality-item">
              <strong>Camps de Qualité Supérieure</strong>
              <p>Tentes spacieuses, literie confortable, douches chaudes, et sanitaires propres</p>
            </div>
            <div class="quality-item">
              <strong>Cuisine Authentique</strong>
              <p>Repas préparés avec ingrédients frais par nos chefs berbères expérimentés</p>
            </div>
            <div class="quality-item">
              <strong>Petits Groupes</strong>
              <p>Maximum 8-12 personnes pour une expérience personnalisée et authentique</p>
            </div>
            <div class="quality-item">
              <strong>Guides Multilingues</strong>
              <p>Français, Anglais, Arabe - Experts locaux avec connaissance approfondie du désert</p>
            </div>
            <div class="quality-item">
              <strong>Flexibilité Totale</strong>
              <p>Itinéraires personnalisables selon vos préférences et rythme de voyage</p>
            </div>
          </div>
        </div>


      </div>
    </section>
  `,
  styles: [`
    .why-choose-section {
      padding: 5rem 0;
      background: linear-gradient(to bottom, #F8FAFC, #F1F5F9);
    }
    
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 0 1.5rem; 
    }
    
    .section-header { 
      margin-bottom: 3rem; 
      text-align: center;
    }
    
    .section-title { 
      font-size: 2.5rem; 
      color: #0F172A; 
      margin-bottom: 0.75rem; 
      font-weight: 800; 
    }
    
    .subtitle { 
      color: #64748B; 
      font-size: 1.1rem; 
    }

    /* Trust Badges */
    .trust-badges {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 4rem;
    }

    .badge-item {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
      transition: all 0.3s;
    }

    .badge-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.12);
    }

    .badge-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #0EA5E9, #0284C7);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .badge-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .badge-text strong {
      color: #0F172A;
      font-size: 1.1rem;
    }

    .badge-text span {
      color: #64748B;
      font-size: 0.9rem;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      transition: all 0.3s;
    }

    .feature-card:hover {
      border-color: #0EA5E9;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .feature-card h3 {
      color: #0F172A;
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      font-weight: 700;
    }

    .feature-card p {
      color: #64748B;
      line-height: 1.6;
      margin: 0;
    }

    .feature-metric {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #E0F2FE;
      color: #0284C7;
      font-weight: 700;
      font-size: 1.1rem;
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
      padding: 3rem;
      background: linear-gradient(135deg, #0F172A, #1E293B);
      border-radius: 20px;
    }

    .stat-card {
      text-align: center;
      color: white;
    }

    .stat-number {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #FCD34D, #F59E0B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      font-size: 1rem;
      opacity: 0.9;
    }

    /* Quality Section */
    .quality-section {
      margin-bottom: 4rem;
    }

    .quality-section h3 {
      font-size: 2rem;
      color: #0F172A;
      margin-bottom: 2rem;
      text-align: center;
      font-weight: 700;
    }

    .quality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .quality-item {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #0EA5E9;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .quality-item strong {
      display: block;
      color: #0F172A;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .quality-item p {
      color: #64748B;
      margin: 0;
      line-height: 1.5;
      font-size: 0.95rem;
    }



    @media (max-width: 768px) {
      .section-title {
        font-size: 2rem;
      }

      .stats-section {
        padding: 2rem 1rem;
      }

      .stat-number {
        font-size: 2.5rem;
      }

      .trust-badges,
      .features-grid,
      .quality-grid {
        grid-template-columns: 1fr;
      }

      .review-card {
        flex: 0 0 100%;
        min-width: 100%;
      }

      .carousel-arrow {
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
      }
    }
  `]
})
export class WhyChooseComponent {
  features: TrustFeature[] = [
    {
      title: 'Guides Locaux Expérimentés',
      description: 'Nos guides berbères natifs partagent leur connaissance profonde du Sahara, de sa culture et de ses traditions, pour une expérience authentique et enrichissante.',
      metric: 'Moyenne 12 ans d\'expérience'
    },
    {
      title: 'Sécurité Maximale',
      description: 'Véhicules 4x4 entretenus, trousses premiers secours, communication satellite, et protocoles d\'urgence stricts pour votre tranquillité d\'esprit.',
      metric: 'Zéro accident depuis 2020'
    },
    {
      title: 'Hébergements de Qualité',
      description: 'Camps traditionnels équipés de tout le confort moderne : tentes spacieuses, literie de qualité, douches chaudes, et sanitaires privés.',
      metric: 'Note hygiène: 9.5/10'
    },
    {
      title: 'Tarifs Transparents',
      description: 'Pas de frais cachés. Tous nos prix incluent transport, hébergement, repas, activités et guide. Annulation flexible jusqu\'à 48h avant le départ.',
      metric: '100% remboursable'
    },
    {
      title: 'Expérience Personnalisée',
      description: 'Itinéraires sur mesure adaptés à vos intérêts, rythme et budget. Groupes privés ou petits groupes de 8 personnes maximum pour plus d\'authenticité.',
      metric: 'Satisfaction: 98%'
    },
    {
      title: 'Respect de l\'Environnement',
      description: 'Nous pratiquons un tourisme responsable: pas de déchets laissés, respect de la faune locale, et soutien aux communautés berbères locales.',
      metric: 'Certifié Éco-Tourisme'
    }
  ];
}