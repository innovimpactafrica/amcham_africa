import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService } from '../../../services/company.service';
import { Subscription } from 'rxjs';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface CompanyData {
  id: number;
  name: string;
  sector: string;
  logo?: string;
  // Ajoutez d'autres propriétés selon votre modèle de données
}

@Component({
  selector: 'app-header-membre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-membre.component.html',
  styleUrl: './header-membre.component.css'
})
export class HeaderMembreComponent implements OnInit, OnDestroy {
  currentRoute: string = '/apropos';
  
  // Gestion des langues
  showLanguagePopup = false;
  languages: Language[] = [
    { code: 'FR', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'EN', name: 'Anglais', flag: 'https://flagcdn.com/w20/gb.png' }
  ];
  currentLanguage: Language = this.languages[0];

  // Données de l'entreprise
  companyData: CompanyData | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  private companySubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.currentRoute = this.router.url || '/apropos';
    
    if (this.currentRoute === '/' || this.currentRoute === '') {
      this.currentRoute = '/apropos';
    }
  }

  ngOnInit(): void {
    // Initialiser la langue actuelle
    this.initializeLanguage();

    // Charger les données de l'entreprise
    this.loadCompanyData();

    // Écouter les changements de route pour mettre à jour l'état actif
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCurrentRoute(event.urlAfterRedirects);
    });
  }

  /**
   * Charger les données de l'entreprise depuis l'API
   */
  private loadCompanyData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Vérifier d'abord l'authentification
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    // Récupérer les informations utilisateur depuis l'API
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('✅ [Header] Utilisateur récupéré avec succès:', currentUser);
        
        // Vérifier si l'utilisateur a une entreprise associée
        if (!currentUser.companyId) {
          this.errorMessage = 'Aucune entreprise associée à votre compte';
          this.isLoading = false;
          return;
        }

        // Charger les données de l'entreprise avec le companyId récupéré
        this.companySubscription = this.companyService.getCompanyById(currentUser.companyId).subscribe({
          next: (company) => {
            console.log('✅ [Header] Données entreprise chargées:', company);
            this.companyData = company;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ [Header] Erreur lors du chargement de l\'entreprise:', error);
            this.errorMessage = 'Erreur lors du chargement des données de l\'entreprise';
            this.isLoading = false;
            
            // En cas d'erreur, utiliser des données par défaut
            // this.setDefaultCompanyData();
          }
        });
      },
      error: (error) => {
        console.error('❌ [Header] Erreur lors de la récupération des informations utilisateur:', error);
        
        // Gestion des erreurs d'authentification
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Session expirée. Redirection vers la page de connexion...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = 'Erreur lors de la récupération de vos informations utilisateur';
        }
        
        this.isLoading = false;
        
        // En cas d'erreur non-authentification, essayer de fallback sur les données locales
        if (error.status !== 401 && error.status !== 403) {
          const localUser = this.authService.getCurrentUser();
          if (localUser?.companyId) {
            console.log('Tentative avec les données locales...');
            this.loadCompanyFromLocalUser(localUser.companyId);
          } else {
            // this.setDefaultCompanyData();


          }
        }
      }
    });
  }

  /**
   * Charger les données de l'entreprise à partir de l'ID utilisateur local
   */
  private loadCompanyFromLocalUser(companyId: number): void {
    this.companySubscription = this.companyService.getCompanyById(companyId).subscribe({
      next: (company) => {
        this.companyData = company;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur avec les données locales:', error);
        // this.setDefaultCompanyData();
        this.isLoading = false;
      }
    });
  }

  /**
   * Définir des données d'entreprise par défaut en cas d'erreur
   */
  // private setDefaultCompanyData(): void {
  //   this.companyData = {
  //     id: 0,
  //     name: 'Global Tech Solutions',
  //     sector: 'Technologie',
  //     logo: '../assets/logoW.png'
  //   };
  // }

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
    return this.companyData?.name || 'Global Tech Solutions';
  }

  /**
   * Obtenir le secteur d'activité
   */
  get companySector(): string {
    return this.companyData?.sector || 'Technologie';
  }

  private initializeLanguage(): void {
    const currentLang = this.languageService.getCurrentLanguage();
    const foundLanguage = this.languages.find(lang => 
      lang.code.toLowerCase() === currentLang.toLowerCase()
    );
    
    if (foundLanguage) {
      this.currentLanguage = foundLanguage;
    } else {
      // Défaut français
      this.currentLanguage = this.languages[0];
      this.languageService.setLanguage('fr');
    }
  }

  private updateCurrentRoute(url: string): void {
    let newRoute = url;
    
    if (newRoute === '/' || newRoute === '') {
      newRoute = '/apropos';
    }
    
    this.currentRoute = newRoute;
    console.log('Route actuelle:', this.currentRoute);
  }

  // Méthodes de navigation améliorées
  navigateToPropos(): void {
    if (this.currentRoute !== '/apropos') {
      console.log('Navigation vers apropos');
      this.router.navigate(['/apropos']);
    }
  }

  navigateToStatistique(): void {
    if (this.currentRoute !== '/statistique') {
      console.log('Navigation vers statistique');
      this.router.navigate(['/statistique']);
    }
  }

  navigateToMedia(): void {
    if (this.currentRoute !== '/media') {
      console.log('Navigation vers media');
      this.router.navigate(['/media']);
    }
  }

  navigateToHoraire(): void {
    if (this.currentRoute !== '/horaire') {
      console.log('Navigation vers horaire');
      this.router.navigate(['/horaire']);
    }
  }

  // Méthodes de gestion des langues
  toggleLanguagePopup(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showLanguagePopup = !this.showLanguagePopup;
  }

  selectLanguage(languageCode: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const selectedLanguage = this.languages.find(lang => 
      lang.code.toLowerCase() === languageCode.toLowerCase()
    );

    if (selectedLanguage && this.currentLanguage.code !== selectedLanguage.code) {
      this.currentLanguage = selectedLanguage;
      this.showLanguagePopup = false;

      // Changer la langue dans le service
      this.languageService.setLanguage(languageCode.toLowerCase());
      console.log(`Langue changée vers: ${selectedLanguage.name}`);
    } else {
      this.showLanguagePopup = false;
    }
  }

  // Fermer la popup en cliquant à l'extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showLanguagePopup) {
      const target = event.target as HTMLElement;
      const isLanguageSelector = target.closest('.language-selector');
      const isLanguagePopup = target.closest('.language-popup');
      
      if (!isLanguageSelector && !isLanguagePopup) {
        this.showLanguagePopup = false;
      }
    }
  }

  // Fermer la popup avec la touche Échap
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showLanguagePopup) {
      this.showLanguagePopup = false;
    }
  }

  // Méthode pour déterminer si un onglet est actif
  isActiveTab(route: string): boolean {
    const isActive = this.currentRoute === route;
    return isActive;
  }

  // Méthode pour rafraîchir les données de l'entreprise
  refreshCompanyData(): void {
    this.loadCompanyData();
  }

  ngOnDestroy(): void {
    // Nettoyer les abonnements
    if (this.companySubscription) {
      this.companySubscription.unsubscribe();
    }
  }
}