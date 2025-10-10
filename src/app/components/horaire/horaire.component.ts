import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService, CompanySchedule, Company, CompanyScheduleRequest } from '../../../services/company.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-horaire',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, CommonModule, HeaderMembreComponent],
  templateUrl: './horaire.component.html',
  styleUrls: ['./horaire.component.css']
})
export class HoraireComponent implements OnInit, OnDestroy {
  horaireForm!: FormGroup;
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  companySchedules: CompanySchedule[] = [];
  loading = false;
  isSaving = false;
  error = '';
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  
  // Données dynamiques de l'entreprise
  companyData: Company | null = null;

  // Mapping des jours de la semaine entre anglais et français
  private dayMapping: { [key: string]: string } = {
    'MONDAY': 'Lundi',
    'TUESDAY': 'Mardi',
    'WEDNESDAY': 'Mercredi',
    'THURSDAY': 'Jeudi',
    'FRIDAY': 'Vendredi',
    'SATURDAY': 'Samedi',
    'SUNDAY': 'Dimanche'
  };

  private reverseDayMapping: { [key: string]: string } = {
    'Lundi': 'MONDAY',
    'Mardi': 'TUESDAY',
    'Mercredi': 'WEDNESDAY',
    'Jeudi': 'THURSDAY',
    'Vendredi': 'FRIDAY',
    'Samedi': 'SATURDAY',
    'Dimanche': 'SUNDAY'
  };

  joursSemaine = [
    { nom: 'Lundi', value: 'lundi', ouvert: true, ouverture: '09:00', fermeture: '18:00' },
    { nom: 'Mardi', value: 'mardi', ouvert: true, ouverture: '09:00', fermeture: '18:00' },
    { nom: 'Mercredi', value: 'mercredi', ouvert: true, ouverture: '09:00', fermeture: '18:00' },
    { nom: 'Jeudi', value: 'jeudi', ouvert: true, ouverture: '09:00', fermeture: '18:00' },
    { nom: 'Vendredi', value: 'vendredi', ouvert: true, ouverture: '09:00', fermeture: '18:00' },
    { nom: 'Samedi', value: 'samedi', ouvert: false, ouverture: '', fermeture: '' },
    { nom: 'Dimanche', value: 'dimanche', ouvert: false, ouverture: '', fermeture: '' }
  ];

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      title: 'Horaires d\'ouverture',
      day: 'Jour',
      availability: 'Disponibilité',
      opening: 'Ouverture',
      closing: 'Fermeture',
      open: 'Ouvert',
      closed: 'Fermé',
      cancel: 'Annuler',
      saveButton: 'Enregistrer les modifications',
      saveSuccess: 'Les horaires ont été sauvegardés avec succès !',
      requiredField: 'Ce champ est obligatoire.',
      invalidTimeFormat: 'Format horaire invalide (HH:MM).',
      invalidField: 'Champ invalide.',
      formError: 'Veuillez corriger les erreurs dans le formulaire.',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.exemple.us',
      profilePreview: 'Aperçu du profil public',
      profileWarning: 'Votre profil n\'est pas encore visible par le public. Complétez vos informations pour activer votre profil.',
      loading: 'Chargement des horaires...',
      errorLoading: 'Erreur lors du chargement des horaires',
      errorLoadingCompany: 'Erreur lors du chargement des informations de l\'entreprise',
      noCompanyError: 'Aucune entreprise associée à votre compte',
      saving: 'Enregistrement en cours...',
      errorSaving: 'Erreur lors de l\'enregistrement des horaires'
    } : {
      title: 'Opening Hours',
      day: 'Day',
      availability: 'Availability',
      opening: 'Opening',
      closing: 'Closing',
      open: 'Open',
      closed: 'Closed',
      cancel: 'Cancel',
      saveButton: 'Save changes',
      saveSuccess: 'Opening hours have been saved successfully!',
      requiredField: 'This field is required.',
      invalidTimeFormat: 'Invalid time format (HH:MM).',
      invalidField: 'Invalid field.',
      formError: 'Please correct the errors in the form.',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.example.us',
      profilePreview: 'Public profile preview',
      profileWarning: 'Your profile is not yet visible to the public. Complete your information to activate your profile.',
      loading: 'Loading schedules...',
      errorLoading: 'Error loading schedules',
      errorLoadingCompany: 'Error loading company information',
      noCompanyError: 'No company associated with your account',
      saving: 'Saving...',
      errorSaving: 'Error saving schedules'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
    
    this.initializeForm();
    this.loadCompanyData();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger les données de l'entreprise depuis l'API
   */
  private loadCompanyData(): void {
    this.isLoading = true;
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
        console.log('✅ [Horaire] Utilisateur récupéré avec succès:', currentUser);
        
        if (!currentUser.companyId) {
          this.errorMessage = this.texts.noCompanyError;
          this.isLoading = false;
          return;
        }

        const companyId = currentUser.companyId;

        this.companyService.getCompanyById(companyId).subscribe({
          next: (company) => {
            console.log('✅ [Horaire] Entreprise chargée avec succès:', company);
            this.companyData = company;
            this.loadCompanySchedules(companyId);
          },
          error: (error) => {
            console.error('❌ [Horaire] Erreur lors du chargement de l\'entreprise:', error);
            this.errorMessage = this.texts.errorLoadingCompany;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ [Horaire] Erreur lors de la récupération des informations utilisateur:', error);
        
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
        
        if (error.status !== 401 && error.status !== 403) {
          const localUser = this.authService.getCurrentUser();
          if (localUser?.companyId) {
            console.log('🔄 [Horaire] Tentative avec les données locales...');
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
        this.loadCompanySchedules(companyId);
      },
      error: (error) => {
        console.error('❌ [Horaire] Erreur lors du chargement de l\'entreprise (fallback):', error);
        this.errorMessage = this.texts.errorLoadingCompany;
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les horaires de l'entreprise depuis l'API
   */
  private loadCompanySchedules(companyId: number): void {
    this.loading = true;
    this.error = '';
    
    this.companyService.getHoraire(companyId).subscribe({
      next: (schedules: CompanySchedule[]) => {
        console.log('✅ [Horaire] Horaires chargés avec succès:', schedules);
        this.companySchedules = schedules;
        this.updateFormWithSchedules(schedules);
        this.loading = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [Horaire] Erreur lors du chargement des horaires:', error);
        this.error = this.texts.errorLoading;
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Mettre à jour le formulaire avec les horaires récupérés
   */
  private updateFormWithSchedules(schedules: CompanySchedule[]): void {
    schedules.forEach(schedule => {
      const dayNameFrench = this.dayMapping[schedule.dayOfWeek];
      const dayValue = dayNameFrench.toLowerCase();
      
      const ouvertControl = this.horaireForm.get(`${dayValue}_ouvert`);
      if (ouvertControl) {
        ouvertControl.setValue(!schedule.closed);
      }

      if (!schedule.closed) {
        const ouvertureControl = this.horaireForm.get(`${dayValue}_ouverture`);
        const fermetureControl = this.horaireForm.get(`${dayValue}_fermeture`);
        
        if (ouvertureControl && schedule.openingTime) {
          ouvertureControl.setValue(schedule.openingTime);
        }
        if (fermetureControl && schedule.closingTime) {
          fermetureControl.setValue(schedule.closingTime);
        }
      }

      const jourIndex = this.joursSemaine.findIndex(j => j.nom.toLowerCase() === dayNameFrench.toLowerCase());
      if (jourIndex !== -1) {
        this.joursSemaine[jourIndex].ouvert = !schedule.closed;
        this.joursSemaine[jourIndex].ouverture = schedule.openingTime || '';
        this.joursSemaine[jourIndex].fermeture = schedule.closingTime || '';
      }
    });

    this.joursSemaine.forEach(jour => {
      this.updateDayValidators(jour.value);
    });
  }

  private initializeForm(): void {
    const formControls: any = {};

    this.joursSemaine.forEach(jour => {
      formControls[`${jour.value}_ouvert`] = [jour.ouvert, Validators.required];
      formControls[`${jour.value}_ouverture`] = [jour.ouverture, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)];
      formControls[`${jour.value}_fermeture`] = [jour.fermeture, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)];
    });

    this.horaireForm = this.fb.group(formControls);
  }

  toggleJour(jourValue: string): void {
    const ouvertControl = this.horaireForm.get(`${jourValue}_ouvert`);
    const ouvertureControl = this.horaireForm.get(`${jourValue}_ouverture`);
    const fermetureControl = this.horaireForm.get(`${jourValue}_fermeture`);

    if (ouvertControl) {
      const nouvelEtat = !ouvertControl.value;
      ouvertControl.setValue(nouvelEtat);

      if (nouvelEtat) {
        ouvertureControl?.setValue('09:00');
        fermetureControl?.setValue('18:00');
        ouvertureControl?.setValidators([Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]);
        fermetureControl?.setValidators([Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]);
      } else {
        ouvertureControl?.setValue('');
        fermetureControl?.setValue('');
        ouvertureControl?.clearValidators();
        fermetureControl?.clearValidators();
      }

      ouvertureControl?.updateValueAndValidity();
      fermetureControl?.updateValueAndValidity();
    }
  }

  /**
   * Mettre à jour les validateurs pour un jour spécifique
   */
  private updateDayValidators(jourValue: string): void {
    const ouvertControl = this.horaireForm.get(`${jourValue}_ouvert`);
    const ouvertureControl = this.horaireForm.get(`${jourValue}_ouverture`);
    const fermetureControl = this.horaireForm.get(`${jourValue}_fermeture`);

    if (ouvertControl?.value) {
      ouvertureControl?.setValidators([Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]);
      fermetureControl?.setValidators([Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]);
    } else {
      ouvertureControl?.clearValidators();
      fermetureControl?.clearValidators();
    }

    ouvertureControl?.updateValueAndValidity();
    fermetureControl?.updateValueAndValidity();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.horaireForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.horaireForm.get(fieldName);
    
    if (!field || !field.errors) {
      return '';
    }

    const errors = field.errors;

    if (errors['required']) {
      return this.texts.requiredField;
    }
    if (errors['pattern']) {
      return this.texts.invalidTimeFormat;
    }

    return this.texts.invalidField;
  }

  /**
   * Sauvegarder les horaires
   */
  onSubmit(): void {
    // Empêcher la soumission multiple
    if (this.isSaving) {
      return;
    }

    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';
    this.error = '';

    // Valider le formulaire
    if (this.horaireForm.invalid) {
      Object.keys(this.horaireForm.controls).forEach(key => {
        this.horaireForm.get(key)?.markAsTouched();
      });
      
      this.errorMessage = this.texts.formError;
      return;
    }

    if (!this.companyData?.id) {
      this.errorMessage = this.currentLang === 'fr'
        ? 'Impossible de sauvegarder : ID de l\'entreprise manquant'
        : 'Cannot save: Company ID missing';
      return;
    }

    this.isSaving = true;

    // Préparer les données pour l'API
    const schedules: CompanyScheduleRequest[] = this.joursSemaine.map(jour => {
      const ouvert = this.horaireForm.get(`${jour.value}_ouvert`)?.value;
      const ouverture = this.horaireForm.get(`${jour.value}_ouverture`)?.value;
      const fermeture = this.horaireForm.get(`${jour.value}_fermeture`)?.value;

      return {
        dayOfWeek: this.reverseDayMapping[jour.nom],
        openingTime: ouvert ? ouverture : null,
        closingTime: ouvert ? fermeture : null,
        closed: !ouvert
      };
    });

    console.log('💾 [Horaire] Sauvegarde des horaires...');
    console.log('📅 [Horaire] Données à envoyer:', schedules);

    // Appeler le service pour mettre à jour les horaires
    this.companyService.updateHoraire(this.companyData.id, schedules).subscribe({
      next: (response) => {
        console.log('✅ [Horaire] Horaires mis à jour avec succès:', response);
        this.successMessage = this.texts.saveSuccess;
        this.isSaving = false;
        
        // Recharger les horaires après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
          this.loadCompanySchedules(this.companyData!.id);
        }, 3000);
      },
      error: (error) => {
        console.error('❌ [Horaire] Erreur lors de la mise à jour des horaires:', error);
        this.errorMessage = error.message || this.texts.errorSaving;
        this.isSaving = false;
      }
    });
  }

  resetForm(): void {
    this.initializeForm();
    const localUser = this.authService.getCurrentUser();
    if (localUser?.companyId) {
      this.loadCompanySchedules(localUser.companyId);
    }
  }

  /**
   * Méthode publique pour recharger les données
   */
  public reloadData(): void {
    this.loadCompanyData();
  }
}