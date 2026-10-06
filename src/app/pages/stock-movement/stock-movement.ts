import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { StockService, Product } from '../../services/stock';
import { MovementService, Movement, MovementType } from '../../services/movement';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Navbar],
  templateUrl: './stock-movement.html',
  styleUrls: ['./stock-movement.css'],
})
export class StockMovement implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private movementService = inject(MovementService);
  private platformId = inject(PLATFORM_ID);

  produtos = signal<Product[]>([]);
  historico = signal<Movement[]>([]);
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);

  // Estado reativo do formulário (o form.value não é signal, então espelhamos aqui)
  tipo = signal<MovementType>('ENTRY');
  produtoId = signal<number | null>(null);
  buscaProduto = signal<string>('');

  // Filtros de Pesquisa
  buscaNome = signal<string>('');
  filtroTipo = signal<string>('');
  dataInicio = signal<string>('');
  dataFim = signal<string>('');

  // Controles de Paginação
  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);

  form = this.fb.nonNullable.group({
    productId: [null as number | null, [Validators.required]],
    type: ['ENTRY' as MovementType, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    requester: [''],
    description: [''],
  });

  // Produto atualmente escolhido no seletor
  produtoSelecionado = computed(
    () => this.produtos().find((p) => p.id === this.produtoId()) ?? null
  );

  // Lista do seletor filtrada pela busca (ignora acentos e maiúsculas)
  produtosFiltrados = computed(() => {
    const termo = this.normalizar(this.buscaProduto());
    const lista = this.produtos();
    return termo ? lista.filter((p) => this.normalizar(p.name).includes(termo)) : lista;
  });

  // Lista fatiada para a página atual
  paginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    const fim = inicio + this.itensPorPagina();
    return this.historico().slice(inicio, fim);
  });

  // Total de páginas calculadas
  totalPaginas = computed(() => {
    const total = Math.ceil(this.historico().length / this.itensPorPagina());
    return total > 0 ? total : 1;
  });

  // Array de números das páginas
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarDados();
    }
  }

  carregarDados(): void {
    this.carregando.set(true);
    this.stockService.getProducts().subscribe({
      next: (prods) => {
        this.produtos.set(prods);
        this.pesquisar();
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.erro.set('Não foi possível carregar a lista de produtos.');
        this.carregando.set(false);
      },
    });
  }

  pesquisar(): void {
    this.carregando.set(true);
    this.paginaAtual.set(1);

    this.movementService
      .searchMovements({
        productName: this.buscaNome() || undefined,
        type: this.filtroTipo() || undefined,
        startDate: this.dataInicio() || undefined,
        endDate: this.dataFim() || undefined,
      })
      .subscribe({
        next: (movs) => {
          this.historico.set(movs);
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro na pesquisa de movimentações:', err);
          this.carregando.set(false);
        },
      });
  }

  limparFiltros(): void {
    this.buscaNome.set('');
    this.filtroTipo.set('');
    this.dataInicio.set('');
    this.dataFim.set('');
    this.pesquisar();
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

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Na saída, produto sem saldo não pode ser escolhido
  indisponivel(p: Product): boolean {
    return this.tipo() === 'EXIT' && p.currentStock < 1;
  }

  selecionarProduto(p: Product): void {
    if (this.indisponivel(p)) return;
    this.produtoId.set(p.id);
    this.form.patchValue({ productId: p.id });
    this.buscaProduto.set('');
  }

  limparProduto(): void {
    this.produtoId.set(null);
    this.form.patchValue({ productId: null });
  }

  selecionarTipo(tipo: MovementType): void {
    this.tipo.set(tipo);
    this.form.patchValue({ type: tipo });

    // Se mudou para Saída e o produto escolhido está sem estoque, limpa a seleção
    const prod = this.produtoSelecionado();
    if (tipo === 'EXIT' && prod && prod.currentStock < 1) {
      this.limparProduto();
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const prodSelecionado = this.produtos().find((p) => p.id === values.productId);

    if (values.type === 'EXIT' && prodSelecionado && prodSelecionado.currentStock < values.quantity) {
      this.erro.set(
        `Estoque insuficiente. Quantidade disponível: ${prodSelecionado.currentStock} ${prodSelecionado.measurement || 'UN'}`
      );
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const currentUserId = Number(localStorage.getItem('userId')) || 1;

    this.movementService
      .createMovement({
        productId: values.productId!,
        type: values.type,
        quantity: values.quantity,
        requester: values.requester || undefined,
        description: values.description || undefined,
        userId: currentUserId,
      })
      .subscribe({
        next: () => {
          this.sucesso.set(
            `Movimentação de ${values.type === 'ENTRY' ? 'Entrada' : 'Saída'} registrada com sucesso!`
          );
          this.salvando.set(false);
          this.form.patchValue({ quantity: 1, requester: '', description: '' });
          this.limparProduto();
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao registrar movimentação:', err);
          this.erro.set(err.error?.message || 'Erro ao registrar movimentação.');
          this.salvando.set(false);
        },
      });
  }
}