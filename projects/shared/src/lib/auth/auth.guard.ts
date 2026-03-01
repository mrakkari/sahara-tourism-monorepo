import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Functional route guard.
 * Redirects unauthenticated users to /login.
 * Optionally accepts an array of allowed roles (empty = any authenticated user).
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        router.navigate(['/login']);
        return false;
    }

    // Check if this route requires a specific role
    const requiredRoles: string[] = route.data?.['roles'] ?? [];
    if (requiredRoles.length > 0) {
        const userRole = authService.getRole() ?? '';
        if (!requiredRoles.includes(userRole)) {
            router.navigate(['/login']);
            return false;
        }
    }

    return true;
};
