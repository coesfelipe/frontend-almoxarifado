// frontend/src/app/pages/stock/stock.ts
import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { StockService, Product } from '../../services/stock';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './stock.html',
  styleUrls: ['./stock.css']
})
export class Stock implements OnInit {
  private stockService = inject(StockService);
  private platformId = inject(PLATFORM_ID);

  produtos = signal<Product[]>([]);
  carregando = signal<boolean>(true);
  erro = signal<string | null>(null);

  // Filtros de busca e estado
  busca = signal<string>('');
  filtro = signal<string>('todos');

  // Controles de Paginação
  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);

  filtros = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'ok', texto: 'Em Estoque' },
    { valor: 'baixo', texto: 'Estoque Baixo' },
    { valor: 'zerado', texto: 'Zerados' }
  ];

  // 1. Aplica a busca textual e o filtro por situação
  filtrados = computed(() => {
    const termo = this.busca().toLowerCase().trim();
    const f = this.filtro();

    return this.produtos().filter(p => {
      const bateBusca = !termo || 
        p.name.toLowerCase().includes(termo) || 
        p.category.toLowerCase().includes(termo);

      const st = this.status(p);
      const bateFiltro = f === 'todos' || st === f;

      return bateBusca && bateFiltro;
    });
  });

  // 2. Fatia a lista filtrada para exibir apenas os itens da página atual
  paginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    const fim = inicio + this.itensPorPagina();
    return this.filtrados().slice(inicio, fim);
  });

  // 3. Calcula o total de páginas com base no filtro ativo
  totalPaginas = computed(() => {
    const total = Math.ceil(this.filtrados().length / this.itensPorPagina());
    return total > 0 ? total : 1;
  });

  // 4. Cria o array de números de páginas
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  // KPIs
  totalProdutos = computed(() => this.produtos().length);
  totalBaixos = computed(() => this.produtos().filter(p => this.status(p) === 'baixo').length);
  totalZerados = computed(() => this.produtos().filter(p => p.currentStock === 0).length);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarProdutos();
    }
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.stockService.getProducts().subscribe({
      next: (dados) => {
        this.produtos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.erro.set('Não foi possível carregar os produtos do servidor.');
        this.carregando.set(false);
      }
    });
  }

  status(p: Product): 'ok' | 'baixo' | 'zerado' {
    if (p.currentStock === 0) return 'zerado';
    if (p.currentStock <= 5) return 'baixo';
    return 'ok';
  }

  aoBuscar(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.busca.set(valor);
    this.paginaAtual.set(1); // Reseta a página ao buscar
  }

  selecionarFiltro(valor: string): void {
    this.filtro.set(valor);
    this.paginaAtual.set(1); // Reseta a página ao filtrar
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
    }
  }

  alterarItensPorPagina(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itensPorPagina.set(Number(target.value));
    this.paginaAtual.set(1);
  }

  excluirProduto(id: number, name: string): void {
    if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      this.stockService.deleteProduct(id).subscribe({
        next: () => {
          this.produtos.update(lista => lista.filter(p => p.id !== id));
        },
        error: (err) => {
          console.error('Erro ao excluir produto:', err);
          alert('Erro ao excluir produto.');
        }
      });
    }
  }
}