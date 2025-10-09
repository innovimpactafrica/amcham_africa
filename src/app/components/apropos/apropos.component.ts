import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService, Company } from '../../../services/company.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-apropos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, CommonModule, HeaderMembreComponent],
  templateUrl: './apropos.component.html',
  styleUrls: ['./apropos.component.css']
})
export class AproposComponent implements OnInit, OnDestroy {
  companyForm!: FormGroup;
  selectedCountry = 'États-Unis';
  logoFile: File | null = null;
  logoPreview: string | null = null;
  currentRoute: string = '/apropos';
  private langSubscription!: Subscription;
  currentLang = 'fr';
  isLoading = true;
  errorMessage = '';
  
  // Données dynamiques de l'entreprise
  companyData: Company | null = null;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      companyLogo: 'Logo de l\'entreprise',
      changeLogo: 'Changer de logo',
      delete: 'Supprimer',
      fileFormat: 'Format recommandé: PNG, JPG. Taille maximale: 2MB.',
      companyInfo: 'Informations de l\'entreprise',
      companyName: 'Nom de l\'entreprise',
      sector: 'Secteur d\'activité',
      description: 'Description de l\'entreprise',
      descriptionHint: 'Cette description apparaîtra sur votre profil public.',
      location: 'Localisation',
      country: 'Pays',
      city: 'Ville',
      address: 'Adresse complète',
      contact: 'Contact',
      email: 'Email',
      phone: 'Téléphone',
      website: 'Site web',
      save: 'Enregistrer les modifications',
      preview: 'Aperçu du profil public',
      requiredField: 'Ce champ est obligatoire.',
      invalidEmail: 'Veuillez saisir une adresse email valide.',
      minLength: 'Minimum {length} caractères requis.',
      maxLength: 'Maximum {length} caractères autorisés.',
      invalidPhone: 'Format de téléphone invalide.',
      invalidUrl: 'Veuillez saisir une URL valide.',
      invalidField: 'Champ invalide.',
      saveSuccess: 'Les informations de l\'entreprise ont été sauvegardées avec succès !',
      formErrors: 'Veuillez corriger les erreurs dans le formulaire.',
      previewFeature: 'Fonctionnalité de prévisualisation à implémenter.',
      fillRequired: 'Veuillez remplir correctement tous les champs obligatoires.',
      fileTypeError: 'Seuls les fichiers PNG et JPG sont autorisés.',
      fileSizeError: 'La taille du fichier ne doit pas dépasser 2MB.',
      fileReadError: 'Erreur lors de la lecture du fichier.',
      loading: 'Chargement des informations...',
      errorLoading: 'Erreur lors du chargement des informations de l\'entreprise'
    } : {
      companyLogo: 'Company Logo',
      changeLogo: 'Change logo',
      delete: 'Delete',
      fileFormat: 'Recommended format: PNG, JPG. Maximum size: 2MB.',
      companyInfo: 'Company Information',
      companyName: 'Company Name',
      sector: 'Business Sector',
      description: 'Company Description',
      descriptionHint: 'This description will appear on your public profile.',
      location: 'Location',
      country: 'Country',
      city: 'City',
      address: 'Full Address',
      contact: 'Contact',
      email: 'Email',
      phone: 'Phone',
      website: 'Website',
      save: 'Save Changes',
      preview: 'Public Profile Preview',
      requiredField: 'This field is required.',
      invalidEmail: 'Please enter a valid email address.',
      minLength: 'Minimum {length} characters required.',
      maxLength: 'Maximum {length} characters allowed.',
      invalidPhone: 'Invalid phone format.',
      invalidUrl: 'Please enter a valid URL.',
      invalidField: 'Invalid field.',
      saveSuccess: 'Company information has been successfully saved!',
      formErrors: 'Please correct the errors in the form.',
      previewFeature: 'Preview feature to be implemented.',
      fillRequired: 'Please fill all required fields correctly.',
      fileTypeError: 'Only PNG and JPG files are allowed.',
      fileSizeError: 'File size must not exceed 2MB.',
      fileReadError: 'Error reading file.',
      loading: 'Loading company information...',
      errorLoading: 'Error loading company information'
    };
  }

  // Pays avec traductions
  get countries() {
    return this.currentLang === 'fr' ? [
      { name: 'États-Unis', flag: '🇺🇸', code: 'US' },
      { name: 'France', flag: '🇫🇷', code: 'FR' },
      { name: 'Canada', flag: '🇨🇦', code: 'CA' },
      { name: 'Allemagne', flag: '🇩🇪', code: 'DE' },
      { name: 'Royaume-Uni', flag: '🇬🇧', code: 'GB' },
      { name: 'Espagne', flag: '🇪🇸', code: 'ES' },
      { name: 'Italie', flag: '🇮🇹', code: 'IT' },
      { name: 'Brésil', flag: '🇧🇷', code: 'BR' }
    ] : [
      { name: 'United States', flag: '🇺🇸', code: 'US' },
      { name: 'France', flag: '🇫🇷', code: 'FR' },
      { name: 'Canada', flag: '🇨🇦', code: 'CA' },
      { name: 'Germany', flag: '🇩🇪', code: 'DE' },
      { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
      { name: 'Spain', flag: '🇪🇸', code: 'ES' },
      { name: 'Italy', flag: '🇮🇹', code: 'IT' },
      { name: 'Brazil', flag: '🇧🇷', code: 'BR' }
    ];
  }

  // Secteurs avec traductions
  get sectors() {
    return this.currentLang === 'fr' ? [
      'Technologie',
      'Finance',
      'Santé',
      'Éducation',
      'Commerce',
      'Industrie',
      'Services',
      'Agriculture',
      'Transport',
      'Énergie',
      'Immobilier',
      'Tourisme'
    ] : [
      'Technology',
      'Finance',
      'Health',
      'Education',
      'Commerce',
      'Industry',
      'Services',
      'Agriculture',
      'Transport',
      'Energy',
      'Real Estate',
      'Tourism'
    ];
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.initializeForm();
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updateFormWithCompanyData();
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données de l'entreprise
    this.loadCompanyData();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

/**
 * Charger les données de l'entreprise depuis l'API
 * Utilise getCurrentUserFromAPI() pour récupérer les données utilisateur fraîches
 */
private loadCompanyData(): void {
  this.isLoading = true;
  this.errorMessage = '';
  
  // Vérifier d'abord qu'on a un token valide
  if (!this.authService.isAuthenticated()) {
    this.errorMessage = this.currentLang === 'fr'
      ? 'Session expirée. Veuillez vous reconnecter.'
      : 'Session expired. Please log in again.';
    this.isLoading = false;
    this.router.navigate(['/login']);
    return;
  }
  
  // Récupérer d'abord les informations utilisateur depuis l'API
  this.authService.getCurrentUserFromAPI().subscribe({
    next: (currentUser) => {
      console.log('Utilisateur récupéré avec succès:', currentUser);
      
      // Vérifier si l'utilisateur a une entreprise associée
      if (!currentUser.companyId) {
        this.errorMessage = this.currentLang === 'fr' 
          ? 'Aucune entreprise associée à votre compte'
          : 'No company associated with your account';
        this.isLoading = false;
        return;
      }

      // Charger les données de l'entreprise avec le companyId récupéré
      this.companyService.getCompanyById(currentUser.companyId).subscribe({
        next: (company) => {
          console.log('Entreprise chargée avec succès:', company);
          this.companyData = company;
          this.updateFormWithCompanyData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'entreprise:', error);
          this.errorMessage = this.texts.errorLoading;
          this.isLoading = false;
        }
      });
    },
    error: (error) => {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.status === 401 || error.status === 403) {
        this.errorMessage = this.currentLang === 'fr'
          ? 'Session expirée. Redirection vers la page de connexion...'
          : 'Session expired. Redirecting to login page...';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.errorMessage = this.currentLang === 'fr'
          ? 'Erreur lors de la récupération de vos informations utilisateur'
          : 'Error retrieving your user information';
      }
      
      this.isLoading = false;
      
      // En cas d'erreur non-authentification, on peut essayer de fallback sur les données locales
      if (error.status !== 401 && error.status !== 403) {
        const localUser = this.authService.getCurrentUser();
        if (localUser?.companyId) {
          console.log('Tentative avec les données locales...');
          this.loadCompanyFromLocalUser(localUser.companyId);
        }
      }
    }
  });
}

/**
 * Méthode de fallback pour charger l'entreprise depuis les données locales
 */
private loadCompanyFromLocalUser(companyId: number): void {
  this.companyService.getCompanyById(companyId).subscribe({
    next: (company) => {
      this.companyData = company;
      this.updateFormWithCompanyData();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Erreur lors du chargement de l\'entreprise (fallback):', error);
      this.errorMessage = this.texts.errorLoading;
      this.isLoading = false;
    }
  });
}

  private initializeForm(): void {
    this.companyForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      sector: ['', [Validators.required]],
      description: [
        '',
        [Validators.required, Validators.minLength(50), Validators.maxLength(500)]
      ],
      country: ['', [Validators.required]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)]],
      website: ['', [Validators.required, this.urlValidator]]
    });
  }

  private updateFormWithCompanyData(): void {
    if (this.companyForm && this.companyData) {
      this.companyForm.patchValue({
        companyName: this.companyData.name || '',
        sector: this.companyData.sector || '',
        description: this.companyData.description || '',
        country: this.companyData.country || '',
        city: this.extractCityFromAddress(this.companyData.address) || '',
        address: this.companyData.address || '',
        email: this.companyData.email || '',
        phone: this.companyData.telephone || '',
        website: this.companyData.webLink || ''
      });

      // Mettre à jour le pays sélectionné
      this.selectedCountry = this.companyData.country || 'États-Unis';

      // Charger l'aperçu du logo si disponible
      if (this.companyData.pictures && this.companyData.pictures.length > 0) {
        this.logoPreview = this.companyData.pictures[0];
      }
    }
  }

  /**
   * Extraire la ville de l'adresse complète
   */
  private extractCityFromAddress(address: string): string {
    if (!address) return '';
    
    // Logique simple pour extraire la ville
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 2]?.trim() || '';
    }
    return '';
  }

  // Validateur personnalisé pour les URLs
  private urlValidator(control: any) {
    if (!control.value) {
      return null;
    }
    
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (!urlPattern.test(control.value)) {
      return { invalidUrl: true };
    }
    
    return null;
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validation du type de fichier
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert(this.texts.fileTypeError);
      this.resetFileInput(event);
      return;
    }

    // Validation de la taille (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(this.texts.fileSizeError);
      this.resetFileInput(event);
      return;
    }

    this.logoFile = file;
    
    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview = e.target?.result as string;
    };
    reader.onerror = () => {
      alert(this.texts.fileReadError);
      this.resetFileInput(event);
    };
    reader.readAsDataURL(file);
  }

  onLogoDelete(): void {
    this.logoFile = null;
    this.logoPreview = null;
    
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private resetFileInput(event: any): void {
    if (event.target) {
      event.target.value = '';
    }
  }

  onCountryChange(event: any): void {
    const selectedCountryName = event.target.value;
    this.selectedCountry = selectedCountryName;
    console.log('Pays sélectionné:', selectedCountryName);
  }

  getSelectedCountryFlag(): string {
    const country = this.countries.find(c => c.name === this.selectedCountry);
    return country ? country.flag : '🌍';
  }

  // Getter pour faciliter l'accès aux contrôles du formulaire
  get formControls() {
    return this.companyForm.controls;
  }

  // Méthodes utilitaires pour la validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    
    if (!field || !field.errors) {
      return '';
    }

    const errors = field.errors;

    if (errors['required']) {
      return this.texts.requiredField;
    }
    if (errors['email']) {
      return this.texts.invalidEmail;
    }
    if (errors['minlength']) {
      return this.texts.minLength.replace('{length}', errors['minlength'].requiredLength);
    }
    if (errors['maxlength']) {
      return this.texts.maxLength.replace('{length}', errors['maxlength'].requiredLength);
    }
    if (errors['pattern']) {
      return this.texts.invalidPhone;
    }
    if (errors['invalidUrl']) {
      return this.texts.invalidUrl;
    }

    return this.texts.invalidField;
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      Object.keys(this.companyForm.controls).forEach(key => {
        this.companyForm.get(key)?.markAsTouched();
      });
      
      alert(this.texts.formErrors);
      return;
    }

    if (this.companyForm.valid) {
      const formData = new FormData();
      
      Object.keys(this.companyForm.value).forEach(key => {
        formData.append(key, this.companyForm.value[key]);
      });
      
      if (this.logoFile) {
        formData.append('logo', this.logoFile);
      }
      
      console.log('Company data:', this.companyForm.value);
      console.log('Logo file:', this.logoFile);
      
      alert(this.texts.saveSuccess);
    }
  }

  resetForm(): void {
    this.companyForm.reset();
    this.onLogoDelete();
    this.updateFormWithCompanyData();
  }

  previewChanges(): void {
    if (this.companyForm.valid) {
      const previewData = {
        ...this.companyForm.value,
        logo: this.logoPreview
      };
      console.log('Preview data:', previewData);
      alert(this.texts.previewFeature);
    } else {
      alert(this.texts.fillRequired);
    }
  }
}