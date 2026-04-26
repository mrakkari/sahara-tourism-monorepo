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
import { ProformasComponent } from './pages/proformas/proformas.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { StatistiquesComponent } from './pages/statistiques/statistiques.component';
import { HebergementComponent } from './pages/nouvelle-reservation/hebergement/hebergement.component';
import { ToursComponent } from './pages/nouvelle-reservation/tours/tours.component';
import { ExtrasComponent } from './pages/nouvelle-reservation/extras/extras.component';
import { HebergementListComponent } from './pages/produits/hebergementList/hebergement-list.component';
import { ToursListComponent } from './pages/produits/toursList/tours-list.component';
import { ExtrasListComponent } from './pages/produits/extrasList/extras-list.component';
import { SourceListComponent } from './pages/produits/sourcesList/source-list.component';


export const routes: Routes = [
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'admin-app',  component: DashboardComponent, data: { roles: ['ADMIN'] } },
      { path: 'reservations',              component: DashboardComponent },
      { path: 'reservation/:id',           component: ReservationDetailComponent },
      { path: 'factures',                  component: InvoicesListComponent },
      { path: 'invoice/:id',               component: InvoiceComponent },
      { path: 'proformas',                 component: ProformasComponent },
      { path: 'clients',                   component: ClientsComponent },
      { path: 'produits',                  component: HebergementListComponent },
      { path: 'tours',                     component: ToursListComponent },
      { path: 'statistiques',              component: StatistiquesComponent },
      { path: 'reports',                   component: ReportsComponent },
      { path: 'extras',                    component: ExtrasListComponent },
      { path: 'sources', component: SourceListComponent },


      // ── Nouvelle Réservation — 3 routed forms ──────────────────
      { path: 'nouvelle-reservation/hebergement', component: HebergementComponent },
      { path: 'nouvelle-reservation/tours',       component: ToursComponent },
      { path: 'nouvelle-reservation/extras',      component: ExtrasComponent },

      { path: '', redirectTo: 'admin-app', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];