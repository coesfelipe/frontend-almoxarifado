import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { StockService } from '../../services/stock';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar],
  templateUrl: './edit-product.html',
  styleUrls: ['./edit-product.css'] // Pode usar o mesmo CSS do create-product.css
})
export class EditProduct implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productId = signal<number | null>(null);
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    measurement: ['UN', [Validators.required]], 
    price: [0, [Validators.min(0)]]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.productId.set(id);
      this.carregarProduto(id);
    } else {
      this.erro.set('ID do produto não informado.');
      this.carregando.set(false);
    }
  }

  carregarProduto(id: number): void {
    this.carregando.set(true);
    this.stockService.getProductById(id).subscribe({
      next: (produto) => {
        // Preenche o formulário com os dados vindos da API
        this.form.patchValue({
          name: produto.name,
          category: produto.category,
          currentStock: produto.currentStock,
          measurement: produto.measurement || 'UN',
          price: produto.price
        });
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar produto:', err);
        this.erro.set('Não foi possível carregar os dados do produto.');
        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid || !this.productId()) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    const dadosAtualizados = this.form.getRawValue();

    this.stockService.updateProduct(this.productId()!, dadosAtualizados).subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/stock']);
      },
      error: (err) => {
        console.error('Erro ao atualizar produto:', err);
        this.erro.set('Erro ao salvar as alterações do produto.');
        this.salvando.set(false);
      }
    });
  }

  campoInvalido(campo: 'name' | 'category' | 'currentStock' | 'measurement'): boolean {
    const control = this.form.get(campo);
    return !!(control && control.touched && control.invalid);
  }
}