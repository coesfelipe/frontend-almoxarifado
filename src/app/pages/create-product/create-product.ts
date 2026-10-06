import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar'; // Ajuste o caminho conforme o seu projeto
import { StockService } from '../../services/stock';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar],
  templateUrl: './create-product.html',
  styleUrls: ['./create-product.css']
})
export class CreateProduct {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private router = inject(Router);

  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);

  // Formulário com validações essenciais
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    measurement: ['UN', [Validators.required]], 
    price: [0, [Validators.min(0)]]
  });

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    const novoProduto = this.form.getRawValue();

    this.stockService.createProduct(novoProduto).subscribe({
      next: () => {
        this.salvando.set(false);
        // Redireciona de volta para a listagem após salvar
        this.router.navigate(['/stock']);
      },
      error: (err) => {
        console.error('Erro ao cadastrar produto:', err);
        this.erro.set('Não foi possível salvar o produto. Verifique se o servidor NestJS está ativo.');
        this.salvando.set(false);
      }
    });
  }

  // Auxiliares para validação no HTML
  campoInvalido(campo: 'name' | 'category' | 'currentStock' | 'measurement'): boolean {
    const control = this.form.get(campo);
    return !!(control && control.touched && control.invalid);
  }
}