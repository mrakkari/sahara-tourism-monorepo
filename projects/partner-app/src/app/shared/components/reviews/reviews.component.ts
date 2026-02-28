import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Review {
  name: string;
  location: string;
  rating: number;
  text: string;
  date: string;
  avatar: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="reviews-section">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="title-gradient">L'avis des voyageurs</h2>
          <div class="rating-badge">
             <span class="star">⭐</span> 4.9/5 sur 2000+ avis
          </div>
        </div>

        <!-- Reviews Grid with Navigation -->
        <div class="reviews-wrapper">
          <button class="carousel-arrow prev" (click)="previousPage()" [disabled]="currentPage === 0">
            ‹
          </button>
          
          <div class="reviews-grid-container">
            <div class="reviews-grid" [style.transform]="'translateX(-' + (currentPage * 100) + '%)'">
              <div class="reviews-page">
                <div *ngFor="let review of getVisibleReviews(0)" class="review-card">
                  <!-- Author Info at Top -->
                  <div class="review-header">
                    <div class="avatar-circle">{{ review.avatar }}</div>
                    <div class="author-info">
                      <div class="author-name">{{ review.name }}</div>
                      <div class="author-location">{{ review.location }}</div>
                    </div>
                    <div class="review-rating">
                      <span class="stars">★★★★★</span>
                    </div>
                  </div>

                  <!-- Review Text -->
                  <div class="review-body">
                    <p [class.collapsed]="!review.expanded">
                      "{{ review.text }}"
                    </p>
                    <button 
                      *ngIf="review.text.length > 150" 
                      class="btn-read-more" 
                      (click)="toggleExpand(review)">
                      {{ review.expanded ? 'Voir moins' : 'Voir la suite' }}
                    </button>
                  </div>

                  <!-- Review Footer -->
                  <div class="review-footer">
                    <span class="review-date">{{ review.date }}</span>
                    <span class="verified-badge">✓ Vérifié</span>
                  </div>
                </div>
              </div>

              <div class="reviews-page" *ngIf="totalPages > 1">
                <div *ngFor="let review of getVisibleReviews(1)" class="review-card">
                  <!-- Author Info at Top -->
                  <div class="review-header">
                    <div class="avatar-circle">{{ review.avatar }}</div>
                    <div class="author-info">
                      <div class="author-name">{{ review.name }}</div>
                      <div class="author-location">{{ review.location }}</div>
                    </div>
                    <div class="review-rating">
                      <span class="stars">★★★★★</span>
                    </div>
                  </div>

                  <!-- Review Text -->
                  <div class="review-body">
                    <p [class.collapsed]="!review.expanded">
                      "{{ review.text }}"
                    </p>
                    <button 
                      *ngIf="review.text.length > 150" 
                      class="btn-read-more" 
                      (click)="toggleExpand(review)">
                      {{ review.expanded ? 'Voir moins' : 'Voir la suite' }}
                    </button>
                  </div>

                  <!-- Review Footer -->
                  <div class="review-footer">
                    <span class="review-date">{{ review.date }}</span>
                    <span class="verified-badge">✓ Vérifié</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button class="carousel-arrow next" (click)="nextPage()" [disabled]="currentPage >= totalPages - 1">
            ›
          </button>
        </div>

        <!-- Carousel Indicators -->
        <div class="carousel-dots" *ngIf="totalPages > 1">
          <button 
            *ngFor="let page of pagesArray; let i = index" 
            class="dot"
            [class.active]="i === currentPage"
            (click)="goToPage(i)"
            [attr.aria-label]="'Aller à la page ' + (i + 1)">
          </button>
        </div>

        <!-- TripAdvisor CTA -->
        <div class="cta-wrapper">
           <a href="https://www.tripadvisor.com" target="_blank" rel="noopener noreferrer" class="btn-tripadvisor">
              <span class="icon">🦉</span> Voir tous nos avis sur TripAdvisor
           </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    
    .reviews-section { 
      padding: 5rem 0; 
      background: white; 
    }
    
    .container { 
      max-width: 1400px; 
      margin: 0 auto; 
      padding: 0 1.5rem; 
    }
    
    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .title-gradient { 
      font-size: 2.5rem; 
      font-weight: 800; 
      color: #1E293B; 
      margin-bottom: 1rem; 
    }
    
    .rating-badge {
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem;
      background: #FFFBEB; 
      color: #B45309; 
      padding: 0.75rem 1.5rem; 
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .star {
      font-size: 1.25rem;
    }

    /* Reviews Grid with Navigation */
    .reviews-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .carousel-arrow {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: white;
      border: 2px solid #E2E8F0;
      color: #0F172A;
      font-size: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      flex-shrink: 0;
      z-index: 10;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .carousel-arrow:hover:not(:disabled) {
      background: #0EA5E9;
      color: white;
      border-color: #0EA5E9;
      transform: scale(1.1);
    }

    .carousel-arrow:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .reviews-grid-container {
      overflow: hidden;
      flex: 1;
    }

    .reviews-grid {
      display: flex;
      transition: transform 0.5s ease-in-out;
    }

    .reviews-page {
      min-width: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .review-card {
      background: #F8FAFC;
      padding: 2rem;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      transition: all 0.3s;
    }

    .review-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      border-color: #CBD5E1;
    }

    /* Review Header */
    .review-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #E2E8F0;
    }

    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E0E7FF, #C7D2FE);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .author-info {
      flex: 1;
    }

    .author-name {
      font-weight: 700;
      color: #0F172A;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }

    .author-location {
      font-size: 0.9rem;
      color: #64748B;
    }

    .review-rating {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .stars {
      color: #F59E0B;
      font-size: 1.1rem;
    }

    /* Review Body */
    .review-body {
      flex: 1;
    }

    .review-body p {
      color: #334155;
      line-height: 1.7;
      font-size: 0.95rem;
      margin: 0 0 0.75rem 0;
      font-style: italic;
    }

    .review-body p.collapsed {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .btn-read-more {
      background: transparent;
      border: none;
      color: #0EA5E9;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: 0.9rem;
      transition: all 0.3s;
      text-decoration: underline;
    }

    .btn-read-more:hover {
      color: #0284C7;
    }

    /* Review Footer */
    .review-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 2px solid #E2E8F0;
      font-size: 0.85rem;
    }

    .review-date {
      color: #94A3B8;
    }

    .verified-badge {
      color: #10B981;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Carousel Dots */
    .carousel-dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #CBD5E1;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
      padding: 0;
    }

    .dot.active {
      background: #0EA5E9;
      width: 30px;
      border-radius: 5px;
    }

    .dot:hover {
      background: #0EA5E9;
    }

    /* CTA */
    .cta-wrapper { 
      text-align: center;
    }

    .btn-tripadvisor {
      display: inline-flex; 
      align-items: center; 
      gap: 0.75rem;
      background: #00AA6C; 
      color: white; 
      padding: 1rem 2.5rem; 
      border-radius: 50px;
      font-weight: 600; 
      text-decoration: none; 
      transition: all 0.3s;
      font-size: 1.1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 170, 108, 0.4);
    }

    .btn-tripadvisor:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 15px 35px -5px rgba(0, 170, 108, 0.5);
      background: #009959;
    }

    .icon {
      font-size: 1.5rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .reviews-page {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .review-card {
        padding: 1.5rem;
      }

      .container {
        max-width: 900px;
      }
    }

    @media (max-width: 768px) {
      .title-gradient {
        font-size: 2rem;
      }

      .rating-badge {
        font-size: 1rem;
        padding: 0.625rem 1.25rem;
      }

      .reviews-wrapper {
        gap: 1rem;
      }

      .carousel-arrow {
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
      }

      .reviews-page {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .review-card {
        padding: 1.5rem;
      }

      .avatar-circle {
        width: 45px;
        height: 45px;
        font-size: 1.5rem;
      }

      .author-name {
        font-size: 1rem;
      }

      .review-body p {
        font-size: 0.9rem;
      }

      .btn-tripadvisor {
        padding: 0.875rem 2rem;
        font-size: 1rem;
      }
    }
  `]
})
export class ReviewsComponent {
  currentPage = 0;
  reviewsPerPage = 3;
  
  reviews: Review[] = [
    { 
      name: 'Sophie Martin', 
      location: 'Paris, France', 
      rating: 5, 
      text: 'Une expérience inoubliable! Notre guide Mohamed était exceptionnel, très professionnel et attentionné. Le camp était confortable et la nourriture délicieuse. Les couchers de soleil sur les dunes étaient à couper le souffle. Je recommande vivement cette aventure à tous ceux qui veulent découvrir la magie du désert tunisien.', 
      date: 'Il y a 2 semaines', 
      avatar: '👩',
      expanded: false
    },
    { 
      name: 'Jean-Pierre Dubois', 
      location: 'Bruxelles, Belgique', 
      rating: 5, 
      text: 'Meilleure décision de nos vacances! Le lever du soleil sur les dunes était magique. Organisation parfaite du début à la fin. L\'équipe a tout fait pour rendre notre séjour mémorable. Les tentes étaient spacieuses et confortables, la cuisine traditionnelle berbère était délicieuse.', 
      date: 'Il y a 1 mois', 
      avatar: '👨',
      expanded: false
    },
    { 
      name: 'Marie Lefebvre', 
      location: 'Montréal, Canada', 
      rating: 5, 
      text: 'Voyage parfaitement organisé avec un excellent rapport qualité-prix. Les guides connaissent très bien le désert et partagent leur passion avec enthousiasme. Les enfants ont adoré la balade à dos de chameau et la nuit sous les étoiles. Une expérience familiale authentique et enrichissante.', 
      date: 'Il y a 3 semaines', 
      avatar: '👩',
      expanded: false
    },
    { 
      name: 'Thomas Bernard', 
      location: 'Genève, Suisse', 
      rating: 5, 
      text: 'Expérience authentique et magique! La nuit sous les étoiles dans le camp berbère était extraordinaire. Cuisine délicieuse et service impeccable. Les guides locaux nous ont fait découvrir des endroits secrets du désert. À refaire absolument!', 
      date: 'Il y a 1 semaine', 
      avatar: '👨',
      expanded: false
    },
    { 
      name: 'Emma Laurent', 
      location: 'Lyon, France', 
      rating: 5, 
      text: 'Un voyage qui restera gravé dans nos mémoires. Les guides étaient passionnés et nous ont fait découvrir des endroits magnifiques hors des sentiers battus. L\'hospitalité berbère est incomparable. Organisation au top du début à la fin!', 
      date: 'Il y a 2 mois', 
      avatar: '👩',
      expanded: false
    },
    { 
      name: 'Lucas Moreau', 
      location: 'Toulouse, France', 
      rating: 5, 
      text: 'Aventure exceptionnelle dans le Sahara! Les paysages sont époustouflants et l\'accueil chaleureux. Le bivouac était très confortable avec tous les équipements nécessaires. Les repas traditionnels étaient un délice. Une expérience que je referai sans hésiter!', 
      date: 'Il y a 1 mois', 
      avatar: '👨',
      expanded: false
    },
    { 
      name: 'Camille Rousseau', 
      location: 'Marseille, France', 
      rating: 5, 
      text: 'Séjour parfait du début à la fin! L\'organisation était impeccable, les guides très professionnels et sympathiques. Les activités proposées étaient variées et passionnantes. Le coucher de soleil sur les dunes restera gravé dans ma mémoire pour toujours.', 
      date: 'Il y a 3 semaines', 
      avatar: '👩',
      expanded: false
    },
    { 
      name: 'Pierre Fontaine', 
      location: 'Nice, France', 
      rating: 5, 
      text: 'Je recommande vivement! Une immersion totale dans la culture berbère avec des guides passionnés qui partagent leur savoir. Les nuits sous les étoiles sont magiques et les rencontres avec les locaux enrichissantes. Prix très raisonnable pour la qualité offerte.', 
      date: 'Il y a 2 semaines', 
      avatar: '👨',
      expanded: false
    }
  ];

  get totalPages(): number {
    return Math.ceil(this.reviews.length / this.reviewsPerPage);
  }

  get pagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i);
  }

  getVisibleReviews(pageIndex: number): Review[] {
    const start = pageIndex * this.reviewsPerPage;
    const end = start + this.reviewsPerPage;
    return this.reviews.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  goToPage(pageIndex: number) {
    this.currentPage = pageIndex;
  }

  toggleExpand(review: Review) {
    review.expanded = !review.expanded;
  }
}