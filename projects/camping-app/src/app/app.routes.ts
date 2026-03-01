import { Routes } from '@angular/router';
import { authGuard } from '../../../shared/src/lib/auth/auth.guard';
import { LoginComponent } from '../../../shared/src/lib/auth/login/login.component';
import { RegisterComponent } from '../../../shared/src/lib/auth/register/register.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { GroupsComponent } from './pages/groups/groups.component';
import { GroupDetailComponent } from './pages/group-detail/group-detail.component';
import { NouveauComponent } from './pages/nouveau/nouveau.component';
import { PaymentHistoryComponent } from './pages/payment-history/payment-history.component';

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
            { path: 'camping-app', component: GroupsComponent, data: { roles: ['CAMPING'] } },
            { path: 'group/:id', component: GroupDetailComponent },
            { path: 'nouveau', component: NouveauComponent },
            { path: 'payment-history', component: PaymentHistoryComponent },
            { path: 'groups', redirectTo: 'camping-app', pathMatch: 'full' },
            { path: '', redirectTo: 'camping-app', pathMatch: 'full' }
        ]
    },

    { path: '**', redirectTo: 'login' }
];
