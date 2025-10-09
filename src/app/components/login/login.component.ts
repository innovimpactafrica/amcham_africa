import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  // Propriété pour créer des tableaux dans le template
  Array = Array;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onRememberMeChange(event: any) {
    this.rememberMe = event.target.checked;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      this.authService.authenticate(email, password).subscribe({
        next: (result) => {
          this.isLoading = false;
          
          if (result.isSuccess && result.user) {
            this.handleSuccessfulLogin(result.user);
          } else {
            this.errorMessage = result.errorMessage || 'Erreur lors de la connexion';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.errorMessage || 'Erreur de connexion au serveur';
          console.error('Erreur authentification:', error);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.loginForm.markAllAsTouched();
    }
  }
navigateToHome (){
 this.router.navigate(['/'])
}
  private handleSuccessfulLogin(user: any) {
    console.log('Connexion réussie:', user);
    
    // Redirection basée sur le profil
    if (user.profil === 'ADMIN_AMCHAM') {
      this.router.navigate(['/members']);
    } else {
      // Pour ADMIN_COMPANY ou tout autre profil
      this.router.navigate(['/apropos']);
    }
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // Implémentez la logique de réinitialisation de mot de passe ici
  }
}