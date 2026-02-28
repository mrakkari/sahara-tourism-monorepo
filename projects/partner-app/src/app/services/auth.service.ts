import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Partner } from '../models/partner.model';
import { MockDataService } from './mock-data.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<Partner | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();

    constructor(private mockDataService: MockDataService) {
        // Auto-login for development/demo purposes
        this.loginMock();
    }

    // Simulate login
    loginMock(): void {
        const partner = this.mockDataService.getKantaouiTravelData();
        this.currentUserSubject.next(partner);
        this.isLoggedInSubject.next(true);
        console.log('Auto-logged in as:', partner.name);
    }

    logout(): void {
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
    }

    getCurrentUser(): Partner | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return this.isLoggedInSubject.value;
    }

    updateProfile(updatedPartner: Partial<Partner>): void {
        const current = this.currentUserSubject.value;
        if (current) {
            const updated = { ...current, ...updatedPartner };
            this.currentUserSubject.next(updated);
            // In a real app, this would persist to backend
        }
    }
}
