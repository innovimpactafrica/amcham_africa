import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, NgModule } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { CompanyService, SearchStats, TotalCompany } from '../../../services/company.service';
import { Subscription } from 'rxjs';

export interface CardStats {
  totalMembers?: number;
  memberGrowth?: number;
  searches?: number;
  searchGrowth?: number;
  adClicks?: number;
  clickGrowth?: number;
  totalAnnouncements?: number;
  announcementGrowth?: number;
  publishedAnnouncements?: number;
  publishedGrowth?: number;
  draftAnnouncements?: number;
}

@Component({
  selector: 'app-card-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-state.component.html',
  styleUrls: ['./card-state.component.css']
})
export class CardStateComponent implements OnInit, OnDestroy {
  // Les stats par défaut ne sont plus fixes, elles seront remplacées par les données dynamiques
  @Input() stats: CardStats = {};

  @Input() type: 'members' | 'announcements'| 'banners' | 'amchams' | 'categories' | 'secteurs' | 'statics' = 'members';

  private langSubscription!: Subscription;
  currentLang = 'fr';
  loading = false;
  error = '';

  // Données dynamiques
  searchStats: SearchStats | null = null;
  totalCompanyStats: TotalCompany | null = null;

  constructor(
    private languageService: LanguageService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données dynamiques pour le type 'members'
    if (this.type === 'members') {
      this.loadDynamicStats();
    }
  }

  /**
   * Charger les statistiques dynamiques depuis l'API
   */
  private loadDynamicStats(): void {
    this.loading = true;
    this.error = '';

    // Charger les deux statistiques en parallèle
    Promise.all([
      this.companyService.getSearchStats().toPromise(),
      this.companyService.getTotalCompanies().toPromise()
    ]).then(([searchStats, totalCompanyStats]) => {
      if (searchStats) {
        this.searchStats = searchStats;
        console.log('Statistiques de recherche chargées:', this.searchStats);
      }
      
      if (totalCompanyStats) {
        this.totalCompanyStats = totalCompanyStats;
        console.log('Statistiques totales des entreprises chargées:', this.totalCompanyStats);
      }
      
      this.loading = false;
    }).catch(error => {
      console.error('Erreur lors du chargement des statistiques:', error);
      this.error = 'Erreur lors du chargement des données';
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  // Textes dynamiques selon le type et la langue
  get texts() {
    if (this.type === 'announcements') {
      return this.currentLang === 'fr' ? {
        totalMembers: 'Annonces totales',
        sinceLastMonth: 'depuis le mois dernier',
        searches: 'Annonces publiées',
        sinceLastWeek: 'depuis la semaine dernière',
        adClicks: 'Annonces brouillon',
        awaitingPublication: 'en attente de publication'
      } : {
        totalMembers: 'Total Announcements',
        sinceLastMonth: 'since last month',
        searches: 'Published Announcements',
        sinceLastWeek: 'since last week',
        adClicks: 'Draft Announcements',
        awaitingPublication: 'awaiting publication'
      };
    }

    // Par défaut (type members)
    return this.currentLang === 'fr' ? {
      totalMembers: 'Membres totaux',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      loading: 'Chargement...',
      error: 'Erreur de chargement'
    } : {
      totalMembers: 'Total Members',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      loading: 'Loading...',
      error: 'Loading error'
    };
  }

  // Valeurs calculées en priorisant les données dynamiques
  get computedStats() {
    // Valeurs par défaut si aucune donnée n'est disponible
    const defaultStats = {
      totalMembers: 0,
      memberGrowth: 0,
      searches: 0,
      searchGrowth: 0,
      adClicks: 348, // Fixe pour l'instant
      clickGrowth: 18, // Fixe pour l'instant
      totalAnnouncements: 45,
      announcementGrowth: 8,
      publishedAnnouncements: 32,
      publishedGrowth: 15,
      draftAnnouncements: 13
    };

    // Fusionner dans l'ordre de priorité :
    // 1. Données dynamiques (si disponibles)
    // 2. Données passées en input
    // 3. Valeurs par défaut

    const mergedStats = { ...defaultStats, ...this.stats };

    // Remplacer par les données dynamiques si disponibles
    if (this.type === 'members') {
      if (this.totalCompanyStats) {
        mergedStats.totalMembers = this.totalCompanyStats.totalCompanies;
        mergedStats.memberGrowth = this.totalCompanyStats.percentageChange;
      }
      
      if (this.searchStats) {
        mergedStats.searches = this.searchStats.total;
        mergedStats.searchGrowth = this.searchStats.weeklyEvolution;
      }
    }

    return mergedStats;
  }

  // Détermine le texte pour le pourcentage de croissance selon le type
  getGrowthText(): string {
    if (this.type === 'announcements') {
      return this.texts.awaitingPublication || '';
    }
    return `+${this.computedStats.clickGrowth}% ${this.texts.sinceLastMonth}`;
  }

  // Formate les nombres avec séparateurs
  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    
    if (this.currentLang === 'fr') {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    } else {
      return value.toLocaleString('en-US');
    }
  }

  // Obtenir la classe CSS pour l'indicateur de croissance
  getGrowthClass(growth: number | undefined): string {
    if (growth === undefined || growth === null) return 'text-emerald-600';
    
    return growth >= 0 ? 'text-emerald-600' : 'text-red-600';
  }

  // Formater le pourcentage de croissance
  formatGrowth(growth: number | undefined): string {
    if (growth === undefined || growth === null) return '+0%';
    
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth}%`;
  }

  // Recharger les données
  reloadData(): void {
    if (this.type === 'members') {
      this.loadDynamicStats();
    }
  }
}