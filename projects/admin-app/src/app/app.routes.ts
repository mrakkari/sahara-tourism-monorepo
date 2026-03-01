import { Routes } from '@angular/router';
import { authGuard } from '../../../shared/src/lib/auth/auth.guard';
import { LoginComponent } from '../../../shared/src/lib/auth/login/login.component';
import { RegisterComponent } from '../../../shared/src/lib/auth/register/register.component';
import { MainLayoutComponent } from './core/layouts/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReservationDetailComponent } from './pages/reservation-detail/reservation-detail.component';
import { InvoiceComponent } from './pages/invoice/invoice.component';
import { InvoicesListComponent } from './pages/invoice/invoices-list.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { NouvelleReservationComponent } from './pages/nouvelle-reservation/nouvelle-reservation.component';
import { ProformasComponent } from './pages/proformas/proformas.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ProduitsComponent } from './pages/produits/produits.component';
import { StatistiquesComponent } from './pages/statistiques/statistiques.component';

export const routes: Routes = [
    // ── Public routes (no layout chrome) ───────────────────────────────────────
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // ── Protected routes (wrapped in MainLayoutComponent = sidebar + topbar) ───
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'admin-app', component: DashboardComponent, data: { roles: ['ADMIN'] } },
            { path: 'nouvelle-reservation', component: NouvelleReservationComponent },
            { path: 'reservations', component: DashboardComponent },
            { path: 'reservation/:id', component: ReservationDetailComponent },
            { path: 'factures', component: InvoicesListComponent },
            { path: 'invoice/:id', component: InvoiceComponent },
            { path: 'proformas', component: ProformasComponent },
            { path: 'clients', component: ClientsComponent },
            { path: 'produits', component: ProduitsComponent },
            { path: 'statistiques', component: StatistiquesComponent },
            { path: 'reports', component: ReportsComponent },
            { path: '', redirectTo: 'admin-app', pathMatch: 'full' }
        ]
    },

    { path: '**', redirectTo: 'login' }
];
