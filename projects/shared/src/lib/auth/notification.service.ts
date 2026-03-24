import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventSourcePolyfill } from 'event-source-polyfill';

// ── Interfaces ────────────────────────────────────────────────
export interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  reservationId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly API = 'http://localhost:8080/api/notifications';

  // ── Reactive state ────────────────────────────────────────────
  // signal = Angular reactive variable
  // any component reading these will update automatically
  // when they change

  // list of all notifications (bell dropdown)
  notifications = signal<Notification[]>([]);

  // unread count (red badge number on bell icon)
  unreadCount = signal<number>(0);

  // SSE connection reference (kept to close it on logout)
  private eventSource: EventSourcePolyfill | null = null;
  private readonly CACHE_KEY = 'cached_notifications';

  constructor(private http: HttpClient) {}

  // ── METHOD 1: subscribe to SSE ────────────────────────────────
  // call this ONCE after login
  // opens permanent connection
  // server pushes through it whenever a notification happens
  subscribeToSSE(token: string): void {
      if (this.eventSource) {
          this.eventSource.close();
      }

      console.log('🔌 SSE connecting...');

      this.eventSource = new EventSourcePolyfill(
          `${this.API}/subscribe`,
          {
              headers: { Authorization: `Bearer ${token}` },
              heartbeatTimeout: 86400000
          }
      );

      this.eventSource.onopen = () => {
          console.log('✅ SSE connected successfully');
      };

      this.eventSource.addEventListener('notification', (event: any) => {
          console.log('📨 SSE notification received:', event.data);
          this.loadNotifications();
          this.loadUnreadCount();
      });

      this.eventSource.onerror = (err: any) => {
          console.error('❌ SSE error:', err);
      };
  }

  // ── METHOD 2: load all notifications from DB ──────────────────
  // call on component init to populate bell dropdown
  // returns Observable — subscribe in component
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.API);
  }

  // ── METHOD 3: get unread count ────────────────────────────────
  // call on init to set the badge number
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.API}/unread-count`);
  }

  // ── METHOD 4: mark one notification as read ───────────────────
  // call when user clicks one notification
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.API}/${notificationId}/read`,
      {}
    );
  }

  // ── METHOD 5: mark all as read ────────────────────────────────
  // call when user opens the bell dropdown
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.API}/read-all`, {});
  }

  // ── METHOD 6: load notifications into signal ──────────────────
  // call on init — loads from DB and stores in signal
    // components read notifications signal directly
  loadNotifications(): void {
      // show cached data immediately while HTTP loads
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
          this.notifications.set(JSON.parse(cached));
      }

      // then load fresh from DB
      this.getNotifications().subscribe(data => {
          this.notifications.set(data);
          // save to cache for next refresh
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      });
  }

  // ── METHOD 7: load unread count into signal ───────────────────
  // call on init — loads from DB and stores in signal
  loadUnreadCount(): void {
      // calculate from cached notifications immediately
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
          const notifications = JSON.parse(cached);
          const unread = notifications.filter((n: any) => !n.isRead).length;
          this.unreadCount.set(unread);
      }

      // then load fresh from DB
      this.getUnreadCount().subscribe(count => {
          this.unreadCount.set(count);
      });
  }

  // ── METHOD 8: close SSE connection ───────────────────────────
  // call on logout
  disconnect(): void {
      if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
      }
      this.notifications.set([]);
      this.unreadCount.set(0);
      localStorage.removeItem(this.CACHE_KEY); // ← clear cache on logout
  }
}