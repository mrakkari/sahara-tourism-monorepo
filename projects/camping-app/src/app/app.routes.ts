import { Routes } from '@angular/router';
import { GroupsComponent } from './pages/groups/groups.component';
import { GroupDetailComponent } from './pages/group-detail/group-detail.component';
import { NouveauComponent } from './pages/nouveau/nouveau.component';
import { PaymentHistoryComponent } from './pages/payment-history/payment-history.component';

export const routes: Routes = [
    { path: '', component: GroupsComponent },
    { path: 'groups', redirectTo: '', pathMatch: 'full' },
    { path: 'group/:id', component: GroupDetailComponent },
    { path: 'nouveau', component: NouveauComponent },
    { path: 'payment-history', component: PaymentHistoryComponent }
];
