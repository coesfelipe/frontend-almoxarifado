import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface idêntica ao DTO/Entity do backend NestJS
export interface Product {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  price: number;
  measurement: string;
}

export interface ExtractedNfeItem {
  productName: string;
  quantity: number;
  category: string;
  ncm: string;
  unitPrice: number;
  measurement: string;
}

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private apiUrl = 'http://localhost:3000';
  private productsUrl = `${this.apiUrl}/products`; // Rota base dos produtos: http://localhost:3000/products

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }

  // MÉTODO PARA BUSCAR POR ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.productsUrl}/${id}`);
  }

  // MÉTODO DE BUSCA COM QUERY PARAMS (bater com @Get('search'))
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.productsUrl}/search`, {
      params: { q: query },
    });
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.productsUrl, product);
  }

  // Atualizar produto existente por ID
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.productsUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productsUrl}/${id}`);
  }

  // CORRIGIDO: Aponta para /products/import-xml e anexa o userId no FormData
  uploadXml(file: File, userId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());

    return this.http.post<any>(`${this.productsUrl}/import-xml`, formData);
  }
}