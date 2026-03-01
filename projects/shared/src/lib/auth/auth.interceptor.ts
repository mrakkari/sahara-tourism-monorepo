import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Functional HTTP interceptor that attaches the Bearer JWT token
 * to every outgoing request (except login/register).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Don't add auth header to auth endpoints themselves
    const isAuthEndpoint = req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/register');

    if (token && !isAuthEndpoint) {
        const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(cloned);
    }

    return next(req);
};
