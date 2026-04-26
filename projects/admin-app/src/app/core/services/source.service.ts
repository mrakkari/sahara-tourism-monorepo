// admin/src/app/core/services/source.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SourceResponse } from '../../../../../shared/src/models/reservation-api.model';

export interface SourceRequest {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SourceService {

  private readonly API_URL = 'http://localhost:8080/api/sources';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SourceResponse[]> {
    return this.http.get<SourceResponse[]>(this.API_URL);
  }

  getById(id: string): Observable<SourceResponse> {
    return this.http.get<SourceResponse>(`${this.API_URL}/${id}`);
  }

  create(request: SourceRequest): Observable<SourceResponse> {
    return this.http.post<SourceResponse>(this.API_URL, request);
  }

  update(id: string, request: SourceRequest): Observable<SourceResponse> {
    return this.http.put<SourceResponse>(`${this.API_URL}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}