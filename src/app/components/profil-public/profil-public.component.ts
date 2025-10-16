import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService, Company } from '../../../services/company.service';

@Component({
  selector: 'app-profil-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil-public.component.html',
  styleUrls: ['./profil-public.component.css']
})
export class ProfilPublicComponent implements OnInit, OnDestroy {
  
  private langSubscription!: Subscription;
  currentLang = 'fr';
  companyData: Company | null = null;
  isLoading = true;
  errorMessage = '';
  logoPreview: string | null = null;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      preview: 'Aperçu du profil public',
      edit: 'Modifier',
      previewTooltip: 'Voir comment votre profil apparaît aux visiteurs',
      editTooltip: 'Modifier les informations du profil',
      noCompanyData: 'Aucune information d\'entreprise disponible',
      sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
      errorLoading: 'Erreur lors du chargement des informations'
    } : {
      preview: 'Public profile preview',
      edit: 'Edit',
      previewTooltip: 'See how your profile appears to visitors',
      editTooltip: 'Edit profile information',
      noCompanyData: 'No company information available',
      sessionExpired: 'Session expired. Please log in again.',
      errorLoading: 'Error loading information'
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

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger les données de l'entreprise connectée
   */
  private loadCompanyData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Vérifier l'authentification
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = this.texts.sessionExpired;
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }
    
    // Récupérer l'utilisateur courant
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('✅ [ProfilPublic] Utilisateur récupéré:', currentUser);
        
        if (!currentUser.companyId) {
          this.errorMessage = this.texts.noCompanyData;
          this.isLoading = false;
          return;
        }

        // Charger les données de l'entreprise
        this.companyService.getCompanyById(currentUser.companyId).subscribe({
          next: (company) => {
            console.log('✅ [ProfilPublic] Entreprise chargée:', company);
            this.companyData = company;
            
            // Charger le logo avec la même logique que dans apropos
            this.loadCompanyLogo(company);
            
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ [ProfilPublic] Erreur chargement entreprise:', error);
            this.errorMessage = this.texts.errorLoading;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ [ProfilPublic] Erreur récupération utilisateur:', error);
        
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = this.texts.sessionExpired;
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
   * Charger le logo de l'entreprise (priorité: logo -> pictures[0])
   */
  private loadCompanyLogo(company: Company): void {
    if (company.logo) {
      this.logoPreview = company.logo;
      console.log('🖼️ [ProfilPublic] Logo chargé depuis company.logo:', this.logoPreview);
    } else if (company.pictures && company.pictures.length > 0) {
      this.logoPreview = company.pictures[0];
      console.log('🖼️ [ProfilPublic] Logo chargé depuis company.pictures[0]:', this.logoPreview);
    } else {
      this.logoPreview = null;
      console.log('⚠️ [ProfilPublic] Aucun logo disponible');
    }
  }


  /**
   * Naviguer vers la page de détails du membre (aperçu public)
  //  */
  navigateToDetaisMembre(): void {
    if (!this.companyData?.id) {
      console.warn('⚠️ [ProfilPublic] Impossible de naviguer : ID de l\'entreprise manquant');
      alert(this.currentLang === 'fr' 
        ? 'Impossible d\'afficher l\'aperçu : informations manquantes'
        : 'Cannot display preview: missing information');
      return;
    }
    
    console.log('🔍 [ProfilPublic] Navigation vers /membre/' + this.companyData.id);
    
    // Naviguer vers la page de détails avec l'ID de l'entreprise
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/membre', this.companyData.id])
    );
    this.router.navigate(['/membre', this.companyData.id]);
  }

  /**
   * Rediriger vers la page de modification du profil
   */
  previewChanges(): void {
    if (!this.companyData?.id) {
      console.warn('⚠️ [ProfilPublic] Impossible de modifier : ID de l\'entreprise manquant');
      alert(this.currentLang === 'fr' 
        ? 'Impossible de modifier : informations manquantes'
        : 'Cannot edit: missing information');
      return;
    }
    // console.log('✏️ [ProfilPublic] Navigation vers la page d\'édition');
    
    this.router.navigate(['/apropos']);
  }



  /**
   * Recharger les données de l'entreprise
   */
  refreshData(): void {
    this.loadCompanyData();
  }

  /**
   * Vérifier si le logo est une URL complète ou relative
   */
  get isFullLogoUrl(): boolean {
    return this.logoPreview?.startsWith('http://') || 
           this.logoPreview?.startsWith('https://') || 
           this.logoPreview?.startsWith('data:') || 
           false;
  }

  /**
   * Obtenir l'URL complète du logo
   */
  get fullLogoUrl(): string {
    if (!this.logoPreview) {
      return '../assets/logoW.png';
    }
    
    if (this.isFullLogoUrl) {
      return this.logoPreview;
    }
    
    // URL relative - ajouter le préfixe
    return `https://wakana.online/repertoire_amchams/${this.logoPreview}`;
  }
}