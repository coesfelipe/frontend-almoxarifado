// frontend/src/app/pages/xml-upload/xml-upload.ts
import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { StockService, ExtractedNfeItem } from '../../services/stock';

@Component({
  selector: 'app-xml-upload',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './xml-uploud.html', 
  styleUrls: ['./xml-uploud.css']
})
export class XmlUpload {
  private stockService = inject(StockService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  arquivoSelecionado = signal<File | null>(null);
  carregando = signal<boolean>(false);
  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);
  produtosExtraidos = signal<ExtractedNfeItem[]>([]);

  aoSelecionarArquivo(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.processarArquivo(target.files[0]);
    }
  }

  aoSoltarArquivo(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processarArquivo(event.dataTransfer.files[0]);
    }
  }

  aoArrastarSobre(event: DragEvent): void {
    event.preventDefault();
  }

  processarArquivo(file: File): void {
  if (!file.name.toLowerCase().endsWith('.xml')) {
    this.erro.set('Por favor, selecione um arquivo com formato .XML válido.');
    return;
  }

  this.arquivoSelecionado.set(file);
  this.erro.set(null);
  this.carregando.set(true);

  if (isPlatformBrowser(this.platformId)) {
    // Obter o ID do usuário autenticado (exemplo com localStorage ou id fixo para testes)
    const userId = Number(localStorage.getItem('userId')) || 1;

    // Passa os dois argumentos exigidos pelo StockService
    this.stockService.uploadXml(file, userId).subscribe({
      next: (resposta) => {
        // Se o backend importar e cadastrar diretamente no banco:
        this.carregando.set(false);
        this.router.navigate(['/stock']);
      },
      error: (err) => {
        console.error('Erro ao importar XML:', err);
        this.erro.set('Não foi possível ler e importar o arquivo XML da Nota Fiscal.');
        this.carregando.set(false);
      }
    });
  }
}

  confirmarEImportar(): void {
    const produtos = this.produtosExtraidos();
    if (produtos.length === 0) return;

    this.salvando.set(true);
    let cadastradosComSucesso = 0;

    // Envia a criação de cada produto extraído para o estoque
    produtos.forEach((item) => {
      this.stockService.createProduct({
        name: item.productName,
        category: item.category,
        currentStock: item.quantity,
        measurement: item.measurement,
        price: item.unitPrice
      }).subscribe({
        next: () => {
          cadastradosComSucesso++;
          if (cadastradosComSucesso === produtos.length) {
            this.salvando.set(false);
            this.router.navigate(['/stock']);
          }
        },
        error: (err) => {
          console.error('Erro ao salvar produto em lote:', err);
          this.erro.set('Ocorreu um erro ao cadastrar alguns dos produtos no estoque.');
          this.salvando.set(false);
        }
      });
    });
  }

  limpar(): void {
    this.arquivoSelecionado.set(null);
    this.produtosExtraidos.set([]);
    this.erro.set(null);
  }
}