// frontend/src/app/pages/dashboard/dashboard.ts
import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { StockService, Product } from '../../services/stock';
import { MovementService, Movement } from '../../services/movement';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  private stockService = inject(StockService);
  private movementService = inject(MovementService);
  private platformId = inject(PLATFORM_ID);

  produtos = signal<Product[]>([]);
  movimentacoes = signal<Movement[]>([]);
  carregando = signal<boolean>(true);
  erro = signal<string | null>(null);

  // --- Paginação das Movimentações ---
  paginaMovimentacoes = signal<number>(1);
  itensPorPaginaMov = signal<number>(5);

  totalPaginasMov = computed(() => {
    const total = Math.ceil(this.movimentacoes().length / this.itensPorPaginaMov());
    return total > 0 ? total : 1;
  });

  movimentacoesPaginadas = computed(() => {
    const inicio = (this.paginaMovimentacoes() - 1) * this.itensPorPaginaMov();
    return this.movimentacoes().slice(inicio, inicio + this.itensPorPaginaMov());
  });

  paginasMovArray = computed(() =>
    Array.from({ length: this.totalPaginasMov() }, (_, i) => i + 1)
  );

  // --- Paginação das Categorias ---
  paginaCategorias = signal<number>(1);
  itensPorPaginaCat = signal<number>(5);

  resumoCategorias = computed(() => {
    const mapa = new Map<string, number>();
    for (const p of this.produtos()) {
      const cat = p.category || 'Sem Categoria';
      mapa.set(cat, (mapa.get(cat) || 0) + 1);
    }
    return Array.from(mapa.entries()).map(([nome, quantidade]) => ({ nome, quantidade }));
  });

  totalPaginasCat = computed(() => {
    const total = Math.ceil(this.resumoCategorias().length / this.itensPorPaginaCat());
    return total > 0 ? total : 1;
  });

  categoriasPaginadas = computed(() => {
    const inicio = (this.paginaCategorias() - 1) * this.itensPorPaginaCat();
    return this.resumoCategorias().slice(inicio, inicio + this.itensPorPaginaCat());
  });

  paginasCatArray = computed(() =>
    Array.from({ length: this.totalPaginasCat() }, (_, i) => i + 1)
  );

  // --- KPIs Computados ---
  totalProdutos = computed(() => this.produtos().length);
  valorTotalEstoque = computed(() =>
    this.produtos().reduce((acc, p) => acc + p.price * p.currentStock, 0)
  );
  estoqueBaixoCount = computed(() =>
    this.produtos().filter((p) => p.currentStock > 0 && p.currentStock <= 5).length
  );
  zeradosCount = computed(() =>
    this.produtos().filter((p) => p.currentStock === 0).length
  );

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarDados();
    }
  }

  carregarDados(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.stockService.getProducts().subscribe({
      next: (prods) => {
        this.produtos.set(prods);
        this.carregarMovimentacoes();
      },
      error: (err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
        this.erro.set('Não foi possível carregar os dados do dashboard.');
        this.carregando.set(false);
      },
    });
  }

  carregarMovimentacoes(): void {
    this.movementService.getMovements().subscribe({
      next: (movs) => {
        this.movimentacoes.set(movs);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar histórico:', err);
        this.carregando.set(false);
      },
    });
  }

  // --- Ações de Paginação ---
  irParaPaginaMov(pg: number): void {
    if (pg >= 1 && pg <= this.totalPaginasMov()) {
      this.paginaMovimentacoes.set(pg);
    }
  }

  irParaPaginaCat(pg: number): void {
    if (pg >= 1 && pg <= this.totalPaginasCat()) {
      this.paginaCategorias.set(pg);
    }
  }
}