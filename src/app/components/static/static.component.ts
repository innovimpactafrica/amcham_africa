import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { LanguageService } from '../../../services/language.service';
import { CompanySectorService, SectorKPI } from '../../../services/company-sector.service';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CardStateComponent } from "../card-state/card-state.component";

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-static',
  standalone: true,
  imports: [CommonModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './static.component.html',
  styleUrls: ['./static.component.css']
})
export class StaticComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('visitsChart', { static: false }) visitsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectorsChart', { static: false }) sectorsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bannerClicksChart', { static: false }) bannerClicksChart!: ElementRef<HTMLCanvasElement>;

  private chartInstances: Chart[] = [];
  private langSubscription!: Subscription;
  currentLang = 'fr';
  currentRoute: string;

  // Données statistiques
  stats = {
    totalMembers: 126,
    memberGrowth: 12,
    searches: 1243,
    searchGrowth: 5,
    adClicks: 348,
    adClickGrowth: 18
  };

  // Données pour les graphiques
  visitsData: { date: string; visits: number }[] = [];
  isLoadingVisits = true;
  visitsError = '';

  popularSearches = [
    { term: 'Technologie', count: 180 },
    { term: 'Finance', count: 140 },
    { term: 'Paris', count: 100 },
    { term: 'États-Unis', count: 85 },
    { term: 'Innovation', count: 75 },
    { term: 'Commerce', count: 60 }
  ];

  // Données dynamiques pour les secteurs
  sectorData: SectorKPI[] = [];
  isLoadingSectors = true;
  sectorError = '';

  // Données dynamiques pour les clics sur bannières
  bannerClicksData: { name: string; clicks: number }[] = [];
  isLoadingBannerClicks = true;
  bannerClicksError = '';

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      statistics: 'Statistiques',
      followPerformance: 'Suivez les performances',
      totalMembers: 'Membres totaux',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      visitsPerDay: 'Visites par jour',
      popularSearches: 'Recherches populaires',
      membersBySector: 'Membres par secteur',
      bannerClicks: 'Clics sur bannières',
      technology: 'Technologie',
      finance: 'Finance',
      health: 'Santé',
      education: 'Éducation',
      industry: 'Industrie',
      commerce: 'Commerce',
      annualConference: 'Conférence annuelle',
      economicForum: 'Forum économique',
      innovationSummit: 'Innovation Summit',
      techConference: 'Tech Conference',
      paris: 'Paris',
      unitedStates: 'États-Unis',
      innovation: 'Innovation',
      loading: 'Chargement des données...',
      errorLoading: 'Erreur lors du chargement des données'
    } : {
      statistics: 'Statistics',
      followPerformance: 'Track performance',
      totalMembers: 'Total Members',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      visitsPerDay: 'Daily Visits',
      popularSearches: 'Popular Searches',
      membersBySector: 'Members by Sector',
      bannerClicks: 'Banner Clicks',
      technology: 'Technology',
      finance: 'Finance',
      health: 'Health',
      education: 'Education',
      industry: 'Industry',
      commerce: 'Commerce',
      annualConference: 'Annual Conference',
      economicForum: 'Economic Forum',
      innovationSummit: 'Innovation Summit',
      techConference: 'Tech Conference',
      paris: 'Paris',
      unitedStates: 'United States',
      innovation: 'Innovation',
      loading: 'Loading data...',
      errorLoading: 'Error loading data'
    };
  }

  constructor(
    private router: Router,
    private languageService: LanguageService,
    public companySectorService: CompanySectorService
  ) {
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updateChartsLanguage();
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger toutes les données
    this.loadSectorData();
    this.loadVisitsKpi();
    this.loadClicksKpi();
  }

  ngAfterViewInit(): void {
    // Délai pour s'assurer que les éléments du DOM sont prêts
    setTimeout(() => {
      this.createVisitsChart();
      this.createSectorsChart();
      this.createBannerClicksChart();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    
    // Détruire tous les graphiques
    this.chartInstances.forEach(chart => {
      chart.destroy();
    });
  }

  /**
   * Charger les données des secteurs depuis l'API
   */
  private loadSectorData(): void {
    this.isLoadingSectors = true;
    this.sectorError = '';

    this.companySectorService.getCompanyBySector().subscribe({
      next: (data) => {
        this.sectorData = this.companySectorService.sortSectorsByPercentage(data);
        this.isLoadingSectors = false;
        
        setTimeout(() => {
          this.updateSectorsChart();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données des secteurs:', error);
        this.sectorError = this.texts.errorLoading;
        this.isLoadingSectors = false;
      }
    });
  }

  /**
   * Charger les données des visites par jour depuis l'API
   */
  loadVisitsKpi(): void {
    this.isLoadingVisits = true;
    this.visitsError = '';

    this.companySectorService.getVisitByDay().subscribe({
      next: (data) => {
        this.visitsData = data.map(visit => ({
          date: visit.date,
          visits: visit.number
        }));
        this.isLoadingVisits = false;
        
        setTimeout(() => {
          this.updateVisitsChart();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des visites par jour:', error);
        this.visitsError = this.texts.errorLoading;
        this.isLoadingVisits = false;
      }
    });
  }

  /**
   * Charger les données des clics sur bannières depuis l'API
   */
  loadClicksKpi(): void {
    this.isLoadingBannerClicks = true;
    this.bannerClicksError = '';

    this.companySectorService.getClicksKpi().subscribe({
      next: (data) => {
        this.bannerClicksData = data.map(kpi => ({
          name: kpi.title || 'Unknown',
          clicks: kpi.clicks || 0
        }));
        this.isLoadingBannerClicks = false;
        
        setTimeout(() => {
          this.updateBannerClicksChart();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clics sur les bannières:', error);
        this.bannerClicksError = this.texts.errorLoading;
        this.isLoadingBannerClicks = false;
      }
    });
  }

  private createVisitsChart(): void {
    if (!this.visitsChart?.nativeElement) return;

    const ctx = this.visitsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.isLoadingVisits || this.visitsData.length === 0) {
      this.createEmptyVisitsChart(ctx);
      return;
    }

    this.createDynamicVisitsChart(ctx);
  }

  private createEmptyVisitsChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [this.texts.loading],
        datasets: [{
          data: [0],
          borderColor: '#E5E7EB',
          backgroundColor: 'rgba(229, 231, 235, 0.1)',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  private createDynamicVisitsChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.visitsData.map(d => d.date),
        datasets: [{
          data: this.visitsData.map(d => d.visits),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#3B82F6',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  private createSectorsChart(): void {
    if (!this.sectorsChart?.nativeElement) return;

    const ctx = this.sectorsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.isLoadingSectors || this.sectorData.length === 0) {
      this.createEmptySectorsChart(ctx);
      return;
    }

    this.createDynamicSectorsChart(ctx);
  }

  private createEmptySectorsChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [this.texts.loading],
        datasets: [{
          data: [100],
          backgroundColor: ['#E5E7EB'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  private createDynamicSectorsChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.sectorData.map(sector => sector.sectorName),
        datasets: [{
          data: this.sectorData.map(sector => sector.percentage),
          backgroundColor: this.sectorData.map(sector => sector.color),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: '#374151',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                return `${label}: ${this.companySectorService.formatPercentage(value)}`;
              }
            }
          }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  private createBannerClicksChart(): void {
    if (!this.bannerClicksChart?.nativeElement) return;

    const ctx = this.bannerClicksChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.isLoadingBannerClicks || this.bannerClicksData.length === 0) {
      this.createEmptyBannerClicksChart(ctx);
      return;
    }

    this.createDynamicBannerClicksChart(ctx);
  }

  private createEmptyBannerClicksChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [this.texts.loading],
        datasets: [{
          data: [0],
          backgroundColor: '#E5E7EB',
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  private createDynamicBannerClicksChart(ctx: CanvasRenderingContext2D): void {
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.bannerClicksData.map(d => d.name),
        datasets: [{
          data: this.bannerClicksData.map(d => d.clicks),
          backgroundColor: '#1E40AF',
          borderColor: '#1E40AF',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });

    this.chartInstances.push(chart);
  }

  /**
   * Mettre à jour le graphique des visites
   */
  private updateVisitsChart(): void {
    const visitsChartIndex = this.chartInstances.findIndex(chart => 
      chart.canvas === this.visitsChart?.nativeElement
    );
    
    if (visitsChartIndex !== -1) {
      this.chartInstances[visitsChartIndex].destroy();
      this.chartInstances.splice(visitsChartIndex, 1);
    }

    if (this.visitsChart?.nativeElement) {
      const ctx = this.visitsChart.nativeElement.getContext('2d');
      if (ctx) {
        this.createDynamicVisitsChart(ctx);
      }
    }
  }

  /**
   * Mettre à jour le graphique des secteurs
   */
  private updateSectorsChart(): void {
    const sectorChartIndex = this.chartInstances.findIndex(chart => 
      chart.canvas === this.sectorsChart?.nativeElement
    );
    
    if (sectorChartIndex !== -1) {
      this.chartInstances[sectorChartIndex].destroy();
      this.chartInstances.splice(sectorChartIndex, 1);
    }

    if (this.sectorsChart?.nativeElement) {
      const ctx = this.sectorsChart.nativeElement.getContext('2d');
      if (ctx) {
        this.createDynamicSectorsChart(ctx);
      }
    }
  }

  /**
   * Mettre à jour le graphique des clics sur bannières
   */
  private updateBannerClicksChart(): void {
    const bannerChartIndex = this.chartInstances.findIndex(chart => 
      chart.canvas === this.bannerClicksChart?.nativeElement
    );
    
    if (bannerChartIndex !== -1) {
      this.chartInstances[bannerChartIndex].destroy();
      this.chartInstances.splice(bannerChartIndex, 1);
    }

    if (this.bannerClicksChart?.nativeElement) {
      const ctx = this.bannerClicksChart.nativeElement.getContext('2d');
      if (ctx) {
        this.createDynamicBannerClicksChart(ctx);
      }
    }
  }

  private updateChartsLanguage(): void {
    this.chartInstances.forEach(chart => {
      chart.destroy();
    });
    this.chartInstances = [];

    setTimeout(() => {
      this.createVisitsChart();
      this.createSectorsChart();
      this.createBannerClicksChart();
    }, 100);
  }

  getPopularSearchTerm(term: string): string {
    const termMap = this.currentLang === 'fr' ? {
      'Technology': 'Technologie',
      'Finance': 'Finance',
      'Paris': 'Paris',
      'United States': 'États-Unis',
      'Innovation': 'Innovation',
      'Commerce': 'Commerce'
    } : {
      'Technologie': 'Technology',
      'Finance': 'Finance',
      'Paris': 'Paris',
      'États-Unis': 'United States',
      'Innovation': 'Innovation',
      'Commerce': 'Commerce'
    };
    return termMap[term as keyof typeof termMap] || term;
  }

  getTotalMembersFromSectors(): number {
    if (this.sectorData.length === 0) return this.stats.totalMembers;
    return Math.round(this.stats.totalMembers * (this.sectorData.reduce((sum, sector) => sum + sector.percentage, 0) / 100));
  }
}