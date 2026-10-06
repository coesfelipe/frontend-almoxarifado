// frontend/src/app/services/movement.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './stock';

export type MovementType = 'ENTRY' | 'EXIT';

export interface Movement {
  id: number;
  type: MovementType;
  quantity: number;
  requester?: string;
  description?: string;
  userId: number;
  productId: number;
  product?: Product;
  createdAt: string;
}

export interface CreateMovementPayload {
  type: MovementType;
  quantity: number;
  requester?: string;
  description?: string;
  userId: number;
  productId: number;
}

export interface MovementSearchFilter {
  productName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/movements';

  getMovements(): Observable<Movement[]> {
    return this.http.get<Movement[]>(this.apiUrl);
  }

  searchMovements(filters: MovementSearchFilter): Observable<Movement[]> {
    let params = new HttpParams();

    if (filters.productName) params = params.set('productName', filters.productName);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<Movement[]>(`${this.apiUrl}/search`, { params });
  }

  createMovement(payload: CreateMovementPayload): Observable<Movement> {
    return this.http.post<Movement>(this.apiUrl, payload);
  }
}