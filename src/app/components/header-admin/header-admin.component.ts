import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { Company, CompanyService } from '../../../services/company.service';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-header-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-admin.component.html',
  styleUrls: ['./header-admin.component.css']
})
export class HeaderAdminComponent implements OnInit, OnDestroy {
  showLanguagePopup = false;
  showSettingsDropdown = false;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  showLogoutModal: boolean = false;
  
  // Données de l'entreprise
  companyData: Company | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  private companySubscription!: Subscription;
  
  languages: Language[] = [
    { code: 'FR', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'EN', name: 'English', flag: 'https://flagcdn.com/w20/gb.png' }
  ];
  currentRoute: string | undefined;

  get currentLanguage(): Language {
    return this.languages.find(lang => 
      lang.code === (this.currentLang === 'fr' ? 'FR' : 'EN')
    ) || this.languages[0];
  }

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      platformTitle: 'Plateforme AmCham - Réseau des Chambres de Commerce Américaines',
      members: 'Membres',
      banners: 'Bannières', 
      announcements: 'Annonces',
      statistics: 'Statistiques',
      amcham: 'Amcham',
      admin: 'Admin',
      changeLanguage: 'Changer la langue',
      french: 'Français',
      english: 'Anglais',
      parameters: 'Paramètres',
      sectorsManagement: 'Gestion des secteurs d\'activités',
      sectorsDescription: 'Gérer les secteurs d\'activités',
      categoriesManagement: 'Gestion des catégories',
      categoriesDescription: 'Gérer les catégories',
      loading: 'Chargement...',
      errorLoading: 'Erreur lors du chargement des données'
    } : {
      platformTitle: 'AmCham Platform - American Chambers of Commerce Network',
      members: 'Members',
      banners: 'Banners',
      announcements: 'Announcements', 
      statistics: 'Statistics',
      amcham: 'Amcham',
      admin: 'Admin',
      changeLanguage: 'Change language',
      french: 'French',
      english: 'English',
      parameters: 'Parameters',
      sectorsManagement: 'Activity sectors management',
      sectorsDescription: 'Manage activity sectors',
      categoriesManagement: 'Categories management',
      categoriesDescription: 'Manage categories',
      loading: 'Loading...',
      errorLoading: 'Error loading data'
    };
  }

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données de l'entreprise
    this.loadCompanyData();
  }
  /**
   * Ouvrir le modal de confirmation de déconnexion
   */
  openLogoutModal(): void {
    this.showLogoutModal = true;
    console.log('Modal de déconnexion ouvert');
  }

  /**
   * Fermer le modal de confirmation de déconnexion
   */
  closeLogoutModal(): void {
    this.showLogoutModal = false;
    console.log('Modal de déconnexion fermé');
  }

  /**
   * Confirmer et exécuter la déconnexion
   */
  confirmLogout(): void {
    console.log('Déconnexion confirmée');
    this.closeLogoutModal();
    this.logout();
  }

  /**
   * Effectuer la déconnexion et rediriger vers la page de login
   */
  private logout(): void {
    try {
      // Appel du service d'authentification pour déconnecter
      this.authService.logout();
      
      // Redirection vers la page de connexion
      this.router.navigate(['/login']);
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.companySubscription) {
      this.companySubscription.unsubscribe();
    }
  }

  /**
   * Charger les données de l'entreprise depuis l'API
   */
  private loadCompanyData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Vérifier d'abord l'authentification
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = this.currentLang === 'fr' 
        ? 'Session expirée. Veuillez vous reconnecter.'
        : 'Session expired. Please log in again.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    // Récupérer les informations utilisateur depuis l'API
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('✅ [Header Admin] Utilisateur récupéré avec succès:', currentUser);
        
        // Vérifier si l'utilisateur a une entreprise associée
        if (!currentUser.countryAmchamId) {
          this.errorMessage = this.currentLang === 'fr' 
            ? 'Aucune entreprise associée à votre compte'
            : 'No company associated with your account';
          this.isLoading = false;
          return;
        }

        // Charger les données de l'entreprise avec le companyId récupéré
        this.companySubscription = this.companyService.getCompanyById(currentUser.countryAmchamId).subscribe({
          next: (company) => {
            console.log('✅ [Header Admin] Données entreprise chargées:', company);
            this.companyData = company;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ [Header Admin] Erreur lors du chargement de l\'entreprise:', error);
            this.errorMessage = this.texts.errorLoading;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ [Header Admin] Erreur lors de la récupération des informations utilisateur:', error);
        
        // Gestion des erreurs d'authentification
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

  /**
   * Obtenir l'URL du logo de l'entreprise
   */
  get companyLogo(): string {
    if (this.companyData?.logo) {
      return this.companyData.logo;
    }
    // Logo par défaut si non disponible
    return '../assets/logoAmcham.png';
  }

  /**
   * Obtenir le nom de l'entreprise
   */
  get companyName(): string {
    return this.companyData?.name || 'Administrateur';
  }

  /**
   * Obtenir le secteur d'activité
   */
  get companySector(): string {
    return this.companyData?.sector || 'AmCham Platform';
  }

  // Fermer les dropdowns en cliquant à l'extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Vérifier si le clic est en dehors des dropdowns
    if (!target.closest('.language-selector') && this.showLanguagePopup) {
      this.showLanguagePopup = false;
    }
    
    if (!target.closest('.relative') && this.showSettingsDropdown) {
      this.showSettingsDropdown = false;
    }
  }

  toggleLanguagePopup(): void {
    this.showLanguagePopup = !this.showLanguagePopup;
    // Fermer l'autre dropdown si ouvert
    if (this.showSettingsDropdown) {
      this.showSettingsDropdown = false;
    }
  }

  toggleSettingsDropdown(): void {
    this.showSettingsDropdown = !this.showSettingsDropdown;
    // Fermer l'autre dropdown si ouvert
    if (this.showLanguagePopup) {
      this.showLanguagePopup = false;
    }
  }

  selectLanguage(langCode: string): void {
    this.languageService.setLanguage(langCode);
    this.showLanguagePopup = false;
  }

  // Navigation methods
  navigateToBanniere(){
    if (this.currentRoute !== '/banners') {
      this.router.navigate(['/banners']);
    }
  }
  
  navigateToAnnonce(){
    if (this.currentRoute !== '/announcements') {
      this.router.navigate(['/announcements']);
    }
  }

  navigateToStatic(){
    if (this.currentRoute !== '/statistics') {
      this.router.navigate(['/statistics']);
    }
  }

  navigateToMembers(){
    if (this.currentRoute !== '/members') {
      this.router.navigate(['/members']);
    }
  }

  navigateToAmchams(){
    if (this.currentRoute !== '/amcham') {
      this.router.navigate(['/amcham']);
    }
  }

  // Navigation pour les paramètres
  navigateToSectors(): void {
    this.router.navigate(['/secteurs']);
  }

  navigateToCategories(): void {
    this.router.navigate(['/categories']);
  }
  
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  /**
   * Méthode pour rafraîchir les données de l'entreprise
   */
  refreshCompanyData(): void {
    this.loadCompanyData();
  }
}