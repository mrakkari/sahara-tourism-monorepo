// admin/src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from '../../../../../shared/src/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly API = 'http://localhost:8080/api';

  // Local cache so the clients list reacts immediately after mutations
  private usersSubject = new BehaviorSubject<UserResponse[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── GET all users (ADMIN only) ────────────────────────────────────────────
  fetchAllUsers(): void {
    this.http.get<UserResponse[]>(`${this.API}/users`).subscribe({
      next: users => this.usersSubject.next(users),
      error: err  => console.error('Failed to load users:', err),
    });
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.users$;
  }

  // ── GET clients + partenaires only (used by reservation dropdowns) ─────────
  getClientsAndPartenaires(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.API}/auth/clients-partenaires`);
  }

  // ── GET single user ───────────────────────────────────────────────────────
  getUserById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API}/users/${userId}`);
  }

  // ── POST /api/users/add — admin creates user (password auto-generated) ─────
  addUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.API}/users/add`, request).pipe(
      tap(created => {
        // Optimistically add to local cache
        this.usersSubject.next([created, ...this.usersSubject.value]);
      })
    );
  }

  // ── PUT /api/users/:id — admin updates user ────────────────────────────────
  updateUser(userId: string, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.API}/users/${userId}`, request).pipe(
      tap(updated => {
        const list  = this.usersSubject.value;
        const index = list.findIndex(u => u.userId === userId);
        if (index !== -1) {
          const next   = [...list];
          next[index]  = updated;
          this.usersSubject.next(next);
        }
      })
    );
  }

  // ── DELETE /api/users/:id — admin deletes user (Keycloak + DB) ────────────
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/users/${userId}`).pipe(
      tap(() => {
        this.usersSubject.next(
          this.usersSubject.value.filter(u => u.userId !== userId)
        );
      })
    );
  }
}