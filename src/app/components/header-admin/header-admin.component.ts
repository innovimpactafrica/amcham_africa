import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { Subscription } from 'rxjs';

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
      categoriesDescription: 'Gérer les catégories'
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
      categoriesDescription: 'Manage categories'
    };
  }

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
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
}