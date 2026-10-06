import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth';

// Valida se "senha" e "confirmar" são iguais
function senhasIguais(group: AbstractControl): ValidationErrors | null {
  const senha = group.get('senha')?.value;
  const confirmar = group.get('confirmar')?.value;
  return senha === confirmar ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  mostrarSenha = false;
  carregando = false;
  erroCadastro = '';

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_.]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', [Validators.required]]
    },
    { validators: [senhasIguais] }
  );

  campoInvalido(username: 'username' | 'email' | 'senha' | 'confirmar'): boolean {
    const c = this.form.controls[username];
    return c.invalid && (c.touched || c.dirty);
  }

  // Só mostra "senhas diferentes" depois que o usuário mexeu no campo de confirmação
  senhasDiferentes(): boolean {
    const c = this.form.controls.confirmar;
    return this.form.hasError('senhasDiferentes') && (c.touched || c.dirty);
  }

  cadastrar(): void {
    this.erroCadastro = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;
    const { username, email, senha } = this.form.getRawValue();

    this.auth.register({ username, email, senha }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err: HttpErrorResponse) => {
        this.erroCadastro =
          err.status === 409
            ? 'Este e-mail ou nome de usuário já está em uso.'
            : 'Não foi possível criar a conta. Tente novamente.';
        this.carregando = false;
      }
    });
  }
}