import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs'; // Adicionado Observable aqui

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private apiUrl = 'http://localhost:3000';
  private loginUrl = `${this.apiUrl}/auth/login`;
  private registerUrl = `${this.apiUrl}/auth/register`;
  private profileUrl = `${this.apiUrl}/auth/profile`;
  private changePasswordUrl = `${this.apiUrl}/auth/change-password`; // Rota /auth/change-password

  login(dados: { email: string; senha: string }) {
    const body = { email: dados.email, password: dados.senha };
    return this.http.post<{ access_token: string }>(this.loginUrl, body).pipe(
      tap(res => {
        if (this.isBrowser) localStorage.setItem('token', res.access_token);
      })
    );
  }

  register(dados: { username: string; email: string; senha: string }) {
    const body = { username: dados.username, email: dados.email, password: dados.senha };
    return this.http.post<{ id: number; email: string; username: string }>(this.registerUrl, body);
  }

  profile() {
    return this.http.get<{ id: number; username: string; email: string }>(
      this.profileUrl
    );
  }

  logout() {
    if (this.isBrowser) localStorage.removeItem('token');
  }

  changePassword(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(this.changePasswordUrl, data);
  }

  get token(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  get logado(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}