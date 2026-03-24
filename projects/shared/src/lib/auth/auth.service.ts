import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from './auth.models';
import { NotificationService } from './notification.service';

const API_BASE = 'http://localhost:8080/api/auth';
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUser());
    public currentUser$ = this.currentUserSubject.asObservable();

    private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();

    constructor(private http: HttpClient, private notificationService: NotificationService) {
        // reconnect SSE if user is already logged in (page reload case)
        if (this.isLoggedIn()) {
            const token = this.getToken();
            if (token) {
                this.notificationService.subscribeToSSE(token);
                this.notificationService.loadNotifications();
                this.notificationService.loadUnreadCount();
            }
        }
    }

    // ─── API calls ─────────────────────────────────────────────────────────────

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${API_BASE}/login`, request).pipe(
            tap(response => {
                this._saveSession(response);
                this.notificationService.subscribeToSSE(response.accessToken); // ← ADD
                this.notificationService.loadNotifications();                  // ← ADD
                this.notificationService.loadUnreadCount();                    // ← ADD
            })
        );
    }

    register(request: RegisterRequest): Observable<any> {
        return this.http.post<any>(`${API_BASE}/register`, request);
    }

    // ─── Session management ────────────────────────────────────────────────────

    private _saveSession(response: LoginResponse): void {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_KEY, response.refreshToken);

        const role = this._extractRoleFromToken(response.accessToken);
        const user: AuthUser = {
            userId: response.userId,
            email: response.email,
            name: response.name,
            role
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        this.notificationService.disconnect(); 
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
    }
    getCurrentUser(): AuthUser | null {
        return this.getUser();
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    getUser(): AuthUser | null {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw) as AuthUser; } catch { return null; }
    }

    getRole(): string | null {
        return this.getUser()?.role ?? null;
    }

    isLoggedIn(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const decoded: any = jwtDecode(token);
            // exp is in seconds since epoch
            return decoded.exp ? decoded.exp * 1000 > Date.now() : true;
        } catch {
            return false;
        }
    }

    // ─── JWT decoding ──────────────────────────────────────────────────────────

    private _extractRoleFromToken(token: string): string {
        try {
            const decoded: any = jwtDecode(token);
            // Keycloak puts roles in realm_access.roles
            const roles: string[] = decoded?.realm_access?.roles ?? [];
            // Pick the first business role (ignore Keycloak internal ones)
            const businessRoles = ['PARTENAIRE', 'CAMPING', 'ADMIN', 'CLIENT'];
            const found = roles.find(r => businessRoles.includes(r.toUpperCase()));
            return found ? found.toUpperCase() : roles[0] ?? '';
        } catch {
            return '';
        }
    }
}
