import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
    },
    {
        path: 'blog',
        loadComponent: () => import('./pages/blog/blog.component').then(m => m.BlogComponent)
    },
    {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
    },

    {
        path: 'historique',
        loadComponent: () => import('./pages/historique/historique.component').then(m => m.HistoriqueComponent)
    },
    {
        path: 'factures',
        loadComponent: () => import('./pages/factures/factures.component').then(m => m.FacturesComponent)
    },
    {
        path: 'statistiques',
        loadComponent: () => import('./pages/statistiques/statistiques.component').then(m => m.StatistiquesComponent)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
    },
    {
        path: 'tour/:id',  // NEW ROUTE - Dynamic tour details
        loadComponent: () => import('./pages/tour-details/tour-details.component').then(m => m.TourDetailsComponent)
    },
    {
        path: 'gallery',
        loadComponent: () => import('./pages/gallery/gallery.component').then(m => m.GalleryComponent)
    },
    {
        path: 'create-reservation',
        loadComponent: () => import('./pages/create-reservation/create-reservation.component').then(m => m.CreateReservationComponent)
    },
    {
        path: 'my-reservations',
        loadComponent: () => import('./pages/my-reservations/my-reservations.component').then(m => m.MyReservationsComponent)
    },
    {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar.component').then(m => m.CalendarComponent)
    },
    {
        path: 'payment/:id',
        loadComponent: () => import('./pages/payment/payment.component').then(m => m.PaymentComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];