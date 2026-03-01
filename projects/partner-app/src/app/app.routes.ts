import { Routes } from '@angular/router';
import { authGuard } from '../../../shared/src/lib/auth/auth.guard';
import { LoginComponent } from '../../../shared/src/lib/auth/login/login.component';
import { RegisterComponent } from '../../../shared/src/lib/auth/register/register.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';

export const routes: Routes = [
    // ── Public routes (no layout chrome) ───────────────────────────────────────
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // ── Protected routes (wrapped in MainLayoutComponent = header + footer) ────
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'partenaire-app',
                data: { roles: ['PARTENAIRE'] },
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
                path: 'tour/:id',
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
            { path: '', redirectTo: 'partenaire-app', pathMatch: 'full' }
        ]
    },

    { path: '**', redirectTo: 'login' }
];
