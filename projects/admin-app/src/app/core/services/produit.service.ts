import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TourType } from '../../../../../shared/src/models/tour-type.model';
import { Tour } from '../../../../../shared/src/models/tour.model';
import { ExtraResponse } from '../../../../../shared/src/models/extra.model';

export interface TourTypeRequest {
  name: string;
  description: string;
  duration: string;
  passengerAdultPrice: number;
  passengerChildPrice: number;
  partnerAdultPrice: number;
  partnerChildPrice: number;
}
export interface TourRequest {
  name: string;
  description: string;
  duration: string;
  passengerAdultPrice: number;
  passengerChildPrice: number;
  partnerAdultPrice: number;
  partnerChildPrice: number;
  isActive: boolean;
}
export interface ExtraRequest {
  name: string;
  description: string;
  duration: string;
  unitPrice: number;
  isActive: boolean;
}
@Injectable({ providedIn: 'root' })
export class ProduitService {
  private readonly apiUrl = 'http://localhost:8080/api/tour-types';
  private readonly toursUrl = 'http://localhost:8080/api/tours';
  private readonly extrasUrl = 'http://localhost:8080/api/extras';



  constructor(private http: HttpClient) {}

  getAll(): Observable<TourType[]> {
    return this.http.get<TourType[]>(this.apiUrl);
  }

  getById(id: string): Observable<TourType> {
    return this.http.get<TourType>(`${this.apiUrl}/${id}`);
  }

  create(request: TourTypeRequest): Observable<TourType> {
    return this.http.post<TourType>(this.apiUrl, request);
  }

  update(id: string, request: TourTypeRequest): Observable<TourType> {
    return this.http.put<TourType>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  // tourssssssss
  getAllTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(this.toursUrl);
    }

    createTour(request: TourRequest): Observable<Tour> {
    return this.http.post<Tour>(this.toursUrl, request);
    }

    updateTour(id: string, request: TourRequest): Observable<Tour> {
    return this.http.put<Tour>(`${this.toursUrl}/${id}`, request);
    }

    deleteTour(id: string): Observable<void> {
    return this.http.delete<void>(`${this.toursUrl}/${id}`);
    }


    // extrassssssssssssssssss
    getAllExtras(): Observable<ExtraResponse[]> {
    return this.http.get<ExtraResponse[]>(this.extrasUrl);
    }

    createExtra(request: ExtraRequest): Observable<ExtraResponse> {
    return this.http.post<ExtraResponse>(this.extrasUrl, request);
    }

    updateExtra(id: string, request: ExtraRequest): Observable<ExtraResponse> {
    return this.http.put<ExtraResponse>(`${this.extrasUrl}/${id}`, request);
    }

    deleteExtra(id: string): Observable<void> {
    return this.http.delete<void>(`${this.extrasUrl}/${id}`);
    }
}