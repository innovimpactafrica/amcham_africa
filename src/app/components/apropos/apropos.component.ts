import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService, Company, CompanyFormData } from '../../../services/company.service';
import { SecteurService, SecteurResponse, Country } from '../../../services/secteur.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-apropos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, CommonModule, HeaderMembreComponent],
  templateUrl: './apropos.component.html',
  styleUrls: ['./apropos.component.css']
})
export class AproposComponent implements OnInit, OnDestroy {
  companyForm!: FormGroup;
  logoFile: File | null = null;
  logoPreview: string | null = null;
  currentRoute: string = '/apropos';
  private langSubscription!: Subscription;
  currentLang = 'fr';
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  
  // Données dynamiques de l'entreprise
  companyData: Company | null = null;
  
  // Listes pour les selects
  sectors: SecteurResponse[] = [];
  countries: Country[] = [];

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
      saving: 'Enregistrement en cours...',
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
      errorLoading: 'Erreur lors du chargement des informations de l\'entreprise',
      errorSaving: 'Erreur lors de l\'enregistrement des modifications',
      selectSector: 'Sélectionner un secteur',
      selectCountry: 'Sélectionner un pays'
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
      saving: 'Saving...',
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
      errorLoading: 'Error loading company information',
      errorSaving: 'Error saving changes',
      selectSector: 'Select a sector',
      selectCountry: 'Select a country'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService,
    private secteurService: SecteurService
  ) {
    this.initializeForm();
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger toutes les données initiales en parallèle
   */
  private loadInitialData(): void {
    this.isLoading = true;
    
    // Charger secteurs et pays en parallèle avec forkJoin
    forkJoin({
      sectors: this.secteurService.getAllSecteurs(),
      countries: this.secteurService.getCountries()
    }).subscribe({
      next: (data) => {
        this.sectors = data.sectors;
        this.countries = data.countries;
        console.log('Secteurs chargés:', this.sectors);
        console.log('Pays chargés:', this.countries);
        
        // Une fois les secteurs et pays chargés, charger les données de l'entreprise
        this.loadCompanyData();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données de référence:', error);
        this.errorMessage = this.currentLang === 'fr'
          ? 'Erreur lors du chargement des données de référence'
          : 'Error loading reference data';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les données de l'entreprise depuis l'API
   */
  private loadCompanyData(): void {
    this.errorMessage = '';
    
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = this.currentLang === 'fr'
        ? 'Session expirée. Veuillez vous reconnecter.'
        : 'Session expired. Please log in again.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }
    
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('Utilisateur récupéré:', currentUser);
        
        if (!currentUser.companyId) {
          this.errorMessage = this.currentLang === 'fr' 
            ? 'Aucune entreprise associée à votre compte'
            : 'No company associated with your account';
          this.isLoading = false;
          return;
        }

        this.companyService.getCompanyById(currentUser.companyId).subscribe({
          next: (company) => {
            console.log('Entreprise chargée:', company);
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
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = this.currentLang === 'fr'
            ? 'Session expirée. Redirection vers la page de connexion...'
            : 'Session expired. Redirecting to login page...';
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = this.texts.errorLoading;
        }
        
        this.isLoading = false;
      }
    });
  }

  private initializeForm(): void {
    this.companyForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      sectorId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      countryId: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)]],
      website: ['', [Validators.required, this.urlValidator]]
    });
  }

  private updateFormWithCompanyData(): void {
    if (this.companyForm && this.companyData) {
      console.log('Mise à jour du formulaire avec les données:', this.companyData);
      
      // Trouver l'ID du secteur correspondant au nom du secteur de l'entreprise
      const secteurTrouve = this.sectors.find(s => 
        s.nameFr === this.companyData?.sector || s.nameEn === this.companyData?.sector
      );
  
      // Trouver l'ID du pays correspondant au nom du pays de l'entreprise
      const paysTrouve = this.countries.find(c => 
        c.name === this.companyData?.country
      );
  
      console.log('Secteur trouvé:', secteurTrouve);
      console.log('Pays trouvé:', paysTrouve);
  
      this.companyForm.patchValue({
        companyName: this.companyData.name || '',
        sectorId: secteurTrouve?.id || '',
        description: this.companyData.description || '',
        countryId: paysTrouve?.id || '',
        address: this.companyData.address || '',
        email: this.companyData.email || '',
        phone: this.companyData.telephone || '',
        website: this.companyData.webLink || ''
      });
  
      // Charger l'aperçu du logo si disponible
      if (this.companyData.logo) {
        this.logoPreview = this.companyData.logo;
      } else if (this.companyData.pictures && this.companyData.pictures.length > 0) {
        this.logoPreview = this.companyData.pictures[0];
      }
  
      // Marquer le formulaire comme "pristine" après le chargement initial
      this.companyForm.markAsPristine();
    }
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

  /**
   * Soumettre le formulaire et enregistrer les modifications
   */
  onSubmit(): void {
    // Empêcher la soumission multiple
    if (this.isSaving) {
      return;
    }

    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';

    // Valider le formulaire
    if (this.companyForm.invalid) {
      Object.keys(this.companyForm.controls).forEach(key => {
        this.companyForm.get(key)?.markAsTouched();
      });
      
      this.errorMessage = this.texts.formErrors;
      return;
    }

    if (!this.companyData?.id) {
      this.errorMessage = this.currentLang === 'fr'
        ? 'Impossible de sauvegarder : ID de l\'entreprise manquant'
        : 'Cannot save: Company ID missing';
      return;
    }

    this.isSaving = true;

    // Préparer les données du formulaire en préservant les valeurs existantes
    const companyFormData: CompanyFormData = {
      name: this.companyForm.value.companyName,
      sectorId: this.companyForm.value.sectorId,
      description: this.companyForm.value.description,
      country: this.companyForm.value.countryId,
      address: this.companyForm.value.address,
      email: this.companyForm.value.email,
      telephone: this.companyForm.value.phone,
      webLink: this.companyForm.value.website,
      logoFile: this.logoFile || undefined,
      
      // Préserver les valeurs existantes pour les champs non modifiables
      countryAmchamId: this.companyData.countryAmchamId || 0,
      videoLink: this.companyData.videoLink || '',
      lat: this.companyData.lat || 0,
      lon: this.companyData.lon || 0
    };

    console.log('Données à envoyer:', companyFormData);

    // Appeler le service pour mettre à jour l'entreprise
    this.companyService.updateCompany(this.companyData.id, companyFormData).subscribe({
      next: (response) => {
        console.log('Entreprise mise à jour avec succès:', response);
        this.successMessage = this.texts.saveSuccess;
        this.isSaving = false;
        
        // Réinitialiser le fichier logo après l'envoi
        this.logoFile = null;
        
        // Recharger les données de l'entreprise après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
          this.loadCompanyData();
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.errorMessage = error.message || this.texts.errorSaving;
        this.isSaving = false;
      }
    });
  }

  resetForm(): void {
    this.updateFormWithCompanyData();
    this.successMessage = '';
    this.errorMessage = '';
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

  /**
   * Obtenir le nom du secteur à partir de l'ID (avec support multilingue)
   */
  getSectorName(sectorId: number): string {
    if (!sectorId || !this.sectors || this.sectors.length === 0) {
      return '';
    }
    
    const sector = this.sectors.find(s => s.id === sectorId);
    if (!sector) {
      return '';
    }
    
    // Retourner le nom selon la langue actuelle
    return this.currentLang === 'fr' ? sector.nameFr : sector.nameEn;
  }

  /**
   * Obtenir le nom du pays à partir de l'ID
   */
  getCountryName(countryId: number): string {
    if (!countryId || !this.countries || this.countries.length === 0) {
      return '';
    }
    
    const country = this.countries.find(c => c.id === countryId);
    return country ? country.name : '';
  }

  /**
   * Obtenir l'icône du pays à partir de l'ID
   */
  getCountryIcon(countryId: number): string {
    if (!countryId || !this.countries || this.countries.length === 0) {
      return '🌍';
    }
    
    const country = this.countries.find(c => c.id === countryId);
    return country?.icon || '🌍';
  }
}