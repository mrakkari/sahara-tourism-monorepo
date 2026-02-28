import { Routes } from '@angular/router';
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
    { path: '', component: DashboardComponent },
    { path: 'nouvelle-reservation', component: NouvelleReservationComponent },
    { path: 'reservations', component: DashboardComponent }, // Re-use dashboard as list
    { path: 'reservation/:id', component: ReservationDetailComponent },
    { path: 'factures', component: InvoicesListComponent },
    { path: 'invoice/:id', component: InvoiceComponent }, // Keep old route for compatibility
    { path: 'proformas', component: ProformasComponent },
    { path: 'clients', component: ClientsComponent },
    { path: 'produits', component: ProduitsComponent },
    { path: 'statistiques', component: StatistiquesComponent },
    { path: 'reports', component: ReportsComponent }
];
