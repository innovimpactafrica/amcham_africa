import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { filter } from 'rxjs/operators';

// ✅ Interface pour les langues
interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showLanguagePopup = false;
  activeSection = 'accueil';
  isMenuOpen = false; // ✅ Pour le menu mobile

  languages: Language[] = [
    { code: 'FR', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'EN', name: 'Anglais', flag: 'https://flagcdn.com/w20/gb.png' }
  ];

  currentLanguage: Language = this.languages[0];

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {
    // Écoute des changements de route
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveSection();
      });
  }

  ngOnInit(): void {
    const currentLang = this.languageService.getCurrentLanguage();
    this.currentLanguage =
      this.languages.find(
        (lang) => lang.code.toLowerCase() === currentLang.toLowerCase()
      ) || this.languages[0];

    // Initialisation de la section active
    this.updateActiveSection();

    // Écoute du scroll
    this.setupScrollListener();
  }

  // ✅ Mettre à jour la section active
  updateActiveSection(): void {
    const url = this.router.url;
    if (url.includes('#annonces')) {
      this.activeSection = 'annonces';
    } else if (url.includes('#annuaires')) {
      this.activeSection = 'annuaires';
    } else {
      this.activeSection = 'accueil';
    }
  }

  // ✅ Détecter la section visible au scroll
  setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      const sections = ['accueil', 'annonces', 'annuaires'];

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            this.activeSection = sectionId;
            break;
          }
        }
      }
    });
  }

  // ✅ Vérifie la section active
  isActive(section: string): boolean {
    return this.activeSection === section;
  }

  // ✅ Navigation
  navigateToHome() {
    this.activeSection = 'accueil';
    this.router.navigate(['/']);
  }

  navigateToAccueil() {
    this.activeSection = 'accueil';
    this.navigateToSection('accueil');
  }

  navigateToAnnonces() {
    this.activeSection = 'annonces';
    this.navigateToSection('annonces');
  }

  navigateToAnnuaires() {
    this.activeSection = 'annuaires';
    this.navigateToSection('annuaires');
  }

  navigateToEspaceMembre() {
    this.router.navigate(['/espace-membre']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // ✅ Langue
  toggleLanguagePopup() {
    this.showLanguagePopup = !this.showLanguagePopup;
  }

  selectLanguage(languageCode: string) {
    const selectedLanguage = this.languages.find(
      (lang) => lang.code.toLowerCase() === languageCode.toLowerCase()
    );

    if (selectedLanguage) {
      this.currentLanguage = selectedLanguage;
      this.showLanguagePopup = false;
      this.languageService.setLanguage(languageCode.toLowerCase());
      console.log(`Langue changée vers: ${selectedLanguage.name}`);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-selector')) {
      this.showLanguagePopup = false;
    }
  }

  // ✅ Scroll doux vers section
  navigateToSection(sectionId: string) {
    this.router.navigate(['/'], { fragment: sectionId }).then(() => {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    });
  }
}
