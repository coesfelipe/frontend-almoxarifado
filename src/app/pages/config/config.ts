import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  selector: 'app-config',
  styleUrl: './config.css',
  templateUrl: './config.html',
})
export class Config {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.form = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // Validador customizado para conferir se as duas senhas novas são iguais
  private passwordMatchValidator(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { currentPassword, newPassword } = this.form.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Senha alterada com sucesso!';
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Erro ao alterar a senha. Verifique sua senha atual.';
      },
    });
  }
}