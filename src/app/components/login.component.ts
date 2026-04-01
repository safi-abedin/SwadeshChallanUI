import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgOptimizedImage],
  template: `
    <div class="login-container">
      <!-- Background gradient -->
      <div class="login-background"></div>

      <div class="login-content d-flex align-items-center justify-content-center min-vh-100">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-12 col-sm-10 col-md-8 col-lg-5">
              <!-- Login Card -->
              <div class="card border-0 shadow-lg login-card">
                <!-- Header with Logo -->
                <div class="card-header bg-white border-0 pt-5 pb-0 text-center">
                  <img
                    ngSrc="/Logo.png"
                    width="90"
                    height="90"
                    alt="Swadesh Packaging Logo"
                    class="mb-3 logo-image"
                    priority
                  >
                  <h1 class="h4 fw-bold text-dark mb-1">Swadesh Packaging</h1>
                  <p class="text-muted mb-0 small">Challan Management System</p>
                </div>

                <!-- Form Body -->
                <div class="card-body p-4">
                  <hr class="my-3">
                  <form [formGroup]="loginForm" (ngSubmit)="handleLogin()" class="vstack gap-3" novalidate>
                    <!-- Username Field -->
                    <div class="mb-2">
                      <label for="username" class="form-label fw-semibold text-secondary mb-2">
                        Username <span class="text-danger">*</span>
                      </label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                          <i class="bi bi-person">👤</i>
                        </span>
                        <input
                          id="username"
                          type="text"
                          class="form-control bg-light border-start-0"
                          formControlName="username"
                          placeholder="Enter your username"
                          [class.is-invalid]="isSubmitted && loginForm.controls.username.invalid"
                        >
                      </div>
                      @if (isSubmitted && loginForm.controls.username.invalid) {
                        <small class="text-danger d-block mt-1">
                          @if (loginForm.controls.username.errors?.['required']) {
                            Username is required
                          } @else if (loginForm.controls.username.errors?.['minlength']) {
                            Username must be at least 3 characters
                          }
                        </small>
                      }
                    </div>

                    <!-- Password Field -->
                    <div class="mb-3">
                      <label for="password" class="form-label fw-semibold text-secondary mb-2">
                        Password <span class="text-danger">*</span>
                      </label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                          <i class="bi bi-lock">🔒</i>
                        </span>
                        <input
                          id="password"
                          [type]="showPassword ? 'text' : 'password'"
                          class="form-control bg-light border-start-0 border-end-0"
                          formControlName="password"
                          placeholder="Enter your password"
                          [class.is-invalid]="isSubmitted && loginForm.controls.password.invalid"
                        >
                        <button
                          type="button"
                          class="btn btn-light border-start-0"
                          (click)="togglePasswordVisibility()"
                          tabindex="-1"
                          title="Toggle password visibility"
                        >
                          {{ showPassword ? '👁️‍🗨️' : '👁️' }}
                        </button>
                      </div>
                      @if (isSubmitted && loginForm.controls.password.invalid) {
                        <small class="text-danger d-block mt-1">
                          @if (loginForm.controls.password.errors?.['required']) {
                            Password is required
                          } @else if (loginForm.controls.password.errors?.['minlength']) {
                            Password must be at least 3 characters
                          }
                        </small>
                      }
                    </div>

                    <!-- Error Message -->
                    @if (errorMessage) {
                      <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                        <i>⚠️</i> <strong>Error!</strong> {{ errorMessage }}
                        <button
                          type="button"
                          class="btn-close"
                          aria-label="Close"
                          (click)="clearError()"
                        ></button>
                      </div>
                    }

                    <!-- Submit Button -->
                    <button
                      type="submit"
                      class="btn btn-primary btn-lg w-100 fw-semibold mt-2"
                      [disabled]="isLoading"
                    >
                      @if (isLoading) {
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Signing in...
                      } @else {
                        ✓ Sign In
                      }
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .login-container {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }

    .login-background {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #efefef 0%, #ebebeb 50%, #dcdcdc 100%);
      z-index: -1;
    }

    .login-content {
      position: relative;
      z-index: 1;
    }

    .login-card {
      border-radius: 16px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .card-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%) !important;
    }

    .card-footer {
      background-color: #f5f7fc !important;
    }

    .logo-image {
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
      animation: fadeInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .form-control,
    .input-group-text {
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 15px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .form-control {
      border: 1px solid #e0e0e0;
      background-color: #f8f9fa;
    }

    .form-control::placeholder {
      color: #adb5bd;
      font-weight: 400;
    }

    .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
      background-color: #fff;
    }

    .input-group-text {
      border: 1px solid #e0e0e0;
      background-color: #f8f9fa;
      color: #667eea;
      font-size: 18px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #f5f5f5 0%, #2885e2 100%);
      border: none;
      border-radius: 8px;
      padding: 11px 24px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.35);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.85;
      cursor: not-allowed;
    }

    .btn-light {
      border: 1px solid #e0e0e0 !important;
      border-radius: 8px;
      cursor: pointer;
      background-color: #f8f9fa !important;
      font-size: 18px;
      padding: 8px 12px;
      transition: all 0.2s ease;
    }

    .btn-light:hover {
      background-color: #e9ecef !important;
    }

    .form-label {
      font-size: 14px;
      margin-bottom: 8px;
      color: #495057;
      letter-spacing: 0.3px;
    }

    .alert {
      border-radius: 8px;
      border: none;
      padding: 12px 16px;
    }

    .alert-info {
      background-color: #e7f3ff;
      color: #0066cc;
      border-left: 4px solid #0066cc;
    }

    .alert-danger {
      background-color: #ffe7e7;
      color: #cc0000;
      border-left: 4px solid #cc0000;
    }

    code {
      background-color: #f0f0f0;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d63384;
      display: inline-block;
      margin-top: 4px;
    }

    .text-muted {
      color: #6c757d !important;
    }

    .text-secondary {
      color: #6c757d !important;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
      border-width: 0.25em;
    }

    .opacity-75 {
      opacity: 0.75;
    }

    hr {
      margin: 0;
      border: none;
      border-top: 1px solid #e0e0e0;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.85);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 576px) {
      .login-card {
        margin: 20px;
        border-radius: 16px;
      }

      .card-body {
        padding: 20px 20px !important;
      }

      .card-header {
        padding-top: 30px !important;
        padding-bottom: 0 !important;
      }

      .card-footer {
        padding: 20px !important;
      }

      .form-control,
      .input-group-text {
        font-size: 16px;
        padding: 10px 12px;
      }

      .btn-primary {
        font-size: 15px;
        padding: 10px 20px;
      }

      .logo-image {
        width: 70px !important;
        height: 70px !important;
      }

      h1.h4 {
        font-size: 18px;
      }

      .card-footer {
        font-size: 12px !important;
      }

      code {
        font-size: 12px;
      }
    }

    @media (max-width: 768px) {
      .login-container {
        padding-top: 20px;
        padding-bottom: 20px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .logo-image,
      .login-card {
        animation: none;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .login-card {
        background-color: #1e1e1e;
        color: #fff;
      }

      .card-header {
        background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%) !important;
      }

      .card-footer {
        background-color: #242424 !important;
      }

      .form-label {
        color: #e0e0e0;
      }

      .form-control,
      .input-group-text {
        background-color: #2d2d2d;
        border-color: #454545;
        color: #e0e0e0;
      }

      .text-muted,
      .text-secondary {
        color: #9ca3af !important;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.group({
    username: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    password: this.fb.control('', [Validators.required, Validators.minLength(3)])
  });

  isSubmitted = false;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  handleLogin(): void {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    // Simulate network delay for UX
    setTimeout(async () => {
      const { username, password } = this.loginForm.getRawValue();
      const safeUsername = (username ?? '').trim();
      const safePassword = (password ?? '').trim();

      if (!this.auth.login(safeUsername, safePassword)) {
        this.errorMessage = 'Invalid credentials. Please check your username and password.';
        this.isLoading = false;
        return;
      }

      try {
        const navigated = await this.router.navigate(['/']);
        if (!navigated) {
          this.errorMessage = 'Sign in succeeded but page navigation failed. Please try again.';
          this.isLoading = false;
        }
      } catch {
        this.errorMessage = 'Unable to complete sign in right now. Please try again.';
        this.isLoading = false;
      }
    }, 600);
  }
}
