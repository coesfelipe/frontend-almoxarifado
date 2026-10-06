import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  mostrarSenha = false;
  carregando = false;
  erroLogin = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    lembrar: [false]
  });

  campoInvalido(nome: 'email' | 'senha'): boolean {
    const c = this.form.controls[nome];
    return c.invalid && (c.touched || c.dirty);
  }

  entrar(): void {
    this.erroLogin = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;
    const { email, senha } = this.form.getRawValue();

    this.auth.login({ email, senha }).subscribe({
      next: () => this.router.navigate(['/home']), // direciona se o acesso estiver ok, para a pagina de home
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.erroLogin = 'E-mail ou senha incorretos.';
        } else if (err.status === 0) {
          this.erroLogin = 'Não foi possível conectar ao servidor.';
        } else {
          this.erroLogin = 'Erro ao entrar. Tente novamente.';
        }
        this.carregando = false;
      }
    });
  }
}