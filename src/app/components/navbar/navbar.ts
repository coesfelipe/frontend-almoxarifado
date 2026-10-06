import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styleUrls: ['./navbar.css'],
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = signal<{ username: string; email: string } | null>(null);
  
  // Signal para controlar a visibilidade do menu no celular
  mobileMenuOpen = signal<boolean>(false);

  iniciais = computed(() => {
    const nome = this.usuario()?.username ?? '';
    const partes = nome.split(/[\s._-]+/).filter(Boolean);
    const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : nome.slice(0, 2);
    return letras.toUpperCase() || '?';
  });

  ngOnInit(): void {
    if (!this.auth.logado) return;
    this.auth.profile().subscribe({
      next: (p) => this.usuario.set(p),
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  fecharMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}