import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { StatisticsService, VueProfilData, ChronologieStats, VueProfilTotal, ContactRecuStats } from '../../../services/statistics.service';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-statistique',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, CommonModule, HeaderMembreComponent],
  templateUrl: './statistique.component.html'
})
export class StatistiqueComponent implements OnInit, AfterViewInit, OnDestroy {
  private lineChart!: Chart;
  private pieChart!: Chart;
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  
  // Données dynamiques
  companyId: number = 1; // À remplacer par l'ID réel de l'entreprise connectée
  vueProfilTotalData: VueProfilTotal | null = null;
  contactRecuData: ContactRecuStats | null = null;
  vueProfilChartData: VueProfilData[] = [];
  chronologieData: ChronologieStats | null = null;
  lastUpdateDate: string = '';
  isLoading: boolean = true;
  dataLoaded: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private statisticsService: StatisticsService
  ) {
    this.currentRoute = this.router.url;
  }

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      pageTitle: 'Statistiques de votre profil',
      pageDescription: 'Suivez les performances de votre profil et l\'engagement des visiteurs.',
      profileViews: 'Vues du profil',
      contactsReceived: 'Contacts reçus',
      lastUpdate: 'Dernière mise à jour',
      timelineContacts: 'Chronologie des contacts',
      sinceLastMonth: 'depuis le mois dernier',
      sinceLastWeek: 'depuis la semaine dernière',
      today: 'Aujourd\'hui',
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      thisYear: 'Cette année',
      dateLabel: 'Date',
      viewsLabel: 'vues',
      contactsLabel: 'contacts',
      loading: 'Chargement...',
      noData: 'Aucune donnée disponible'
    } : {
      pageTitle: 'Your Profile Statistics',
      pageDescription: 'Track your profile performance and visitor engagement.',
      profileViews: 'Profile Views',
      contactsReceived: 'Contacts Received',
      lastUpdate: 'Last Update',
      timelineContacts: 'Contacts Timeline',
      sinceLastMonth: 'since last month',
      sinceLastWeek: 'since last week',
      today: 'Today',
      thisWeek: 'This week',
      thisMonth: 'This month',
      thisYear: 'This year',
      dateLabel: 'Date',
      viewsLabel: 'views',
      contactsLabel: 'contacts',
      loading: 'Loading...',
      noData: 'No data available'
    };
  }

  // Métriques principales formatées
  get metriques() {
    return {
      vuesProfil: {
        valeur: this.vueProfilTotalData?.total ? this.formatNumber(this.vueProfilTotalData.total) : '0',
        croissance: this.vueProfilTotalData ? this.formatEvolution(this.vueProfilTotalData.weeklyEvolution) : '+0%',
        periode: this.texts.sinceLastWeek,
        croissancePositive: this.vueProfilTotalData ? this.vueProfilTotalData.weeklyEvolution >= 0 : true
      },
      contactsRecus: {
        valeur: this.contactRecuData?.total ? this.formatNumber(this.contactRecuData.total) : '0',
        croissance: this.contactRecuData ? this.formatEvolution(this.contactRecuData.weeklyEvolution) : '+0%',
        periode: this.texts.sinceLastWeek,
        croissancePositive: this.contactRecuData ? this.contactRecuData.weeklyEvolution >= 0 : true
      },
      derniereMiseAJour: {
        valeur: this.lastUpdateDate || '--/--/----',
        croissance: this.vueProfilTotalData ? this.formatEvolution(this.vueProfilTotalData.weeklyEvolution) : '+0%',
        periode: this.texts.sinceLastMonth,
        croissancePositive: this.vueProfilTotalData ? this.vueProfilTotalData.weeklyEvolution >= 0 : true
      }
    };
  }

  // Données pour la légende du graphique en secteurs
  get donneesChronologie() {
    if (!this.chronologieData) {
      return [
        { label: this.texts.today, valeur: 0, couleur: 'bg-orange-500' },
        { label: this.texts.thisWeek, valeur: 0, couleur: 'bg-green-500' },
        { label: this.texts.thisMonth, valeur: 0, couleur: 'bg-yellow-500' },
        { label: this.texts.thisYear, valeur: 0, couleur: 'bg-blue-500' }
      ];
    }

    return [
      { label: this.texts.today, valeur: this.chronologieData.today, couleur: 'bg-orange-500' },
      { label: this.texts.thisWeek, valeur: this.chronologieData.lastWeek, couleur: 'bg-green-500' },
      { label: this.texts.thisMonth, valeur: this.chronologieData.lastMonth, couleur: 'bg-yellow-500' },
      { label: this.texts.thisYear, valeur: this.chronologieData.currentYear, couleur: 'bg-blue-500' }
    ];
  }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (this.dataLoaded) {
        this.updateChartsLanguage();
      }
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données
    this.loadAllStatistics();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront initialisés après le chargement des données
  }

  private loadAllStatistics(): void {
    this.isLoading = true;

    // Charger toutes les statistiques en parallèle
    Promise.all([
      this.loadVueProfilTotal(),
      this.loadContactRecu(),
      this.loadVueProfil(),
      this.loadChronologie()
    ]).then(() => {
      this.isLoading = false;
      this.dataLoaded = true;
      // Attendre que le DOM soit complètement rendu
      setTimeout(() => {
        this.initLineChart();
        this.initPieChart();
      }, 300);
    }).catch(error => {
      console.error('Erreur lors du chargement des statistiques:', error);
      this.isLoading = false;
      this.dataLoaded = true;
    });
  }

  private loadVueProfilTotal(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statisticsService.getVueProfilTotal(this.companyId).subscribe({
        next: (data: any) => {
          this.vueProfilTotalData = data;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des vues totales:', error);
          reject(error);
        }
      });
    });
  }

  private loadContactRecu(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statisticsService.getContactRecu(this.companyId).subscribe({
        next: (data) => {
          this.contactRecuData = data;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des contacts reçus:', error);
          reject(error);
        }
      });
    });
  }

  private loadVueProfil(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statisticsService.getVueProfil(this.companyId).subscribe({
        next: (data) => {
          this.vueProfilChartData = data;
          if (data.length > 0) {
            this.lastUpdateDate = this.formatFullDate(data[data.length - 1].date);
          }
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des vues profil:', error);
          reject(error);
        }
      });
    });
  }

  private loadChronologie(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statisticsService.getChronologie(this.companyId).subscribe({
        next: (data) => {
          this.chronologieData = data;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement de la chronologie:', error);
          reject(error);
        }
      });
    });
  }

  private formatNumber(num: number): string {
    if (this.currentLang === 'fr') {
      return num.toLocaleString('fr-FR');
    } else {
      return num.toLocaleString('en-US');
    }
  }

  private formatEvolution(evolution: number): string {
    const sign = evolution >= 0 ? '+' : '';
    return `${sign}${evolution.toFixed(1)}%`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (this.currentLang === 'fr') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    }
  }

  private formatFullDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (this.currentLang === 'fr') {
      return date.toLocaleDateString('fr-FR');
    } else {
      return date.toLocaleDateString('en-US');
    }
  }

  private updateChartsLanguage(): void {
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    
    setTimeout(() => {
      this.initLineChart();
      this.initPieChart();
    }, 100);
  }

  private initLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas lineChart non trouvé');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Impossible d\'obtenir le contexte 2D du canvas lineChart');
      return;
    }

    const labels = this.vueProfilChartData.map(d => this.formatDate(d.date));
    const dataValues = this.vueProfilChartData.map(d => d.count);

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: labels.length > 0 ? labels : ['--'],
        datasets: [{
          label: this.texts.profileViews,
          data: dataValues.length > 0 ? dataValues : [0],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                if (this.vueProfilChartData[index]) {
                  return this.formatFullDate(this.vueProfilChartData[index].date);
                }
                return context[0].label;
              },
              label: (context) => `${context.parsed.y} ${this.texts.viewsLabel}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#64748B' },
            grid: { color: 'rgba(148, 163, 184, 0.15)' }
          },
          x: {
            ticks: { color: '#64748B' },
            grid: { display: false }
          }
        }
      }
    };

    this.lineChart = new Chart(ctx, config);
  }

  private initPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas pieChart non trouvé');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Impossible d\'obtenir le contexte 2D du canvas pieChart');
      return;
    }

    const chronoData = this.donneesChronologie;

    const config: ChartConfiguration = {
      type: 'pie' as ChartType,
      data: {
        labels: chronoData.map(d => d.label),
        datasets: [{
          data: chronoData.map(d => d.valeur),
          backgroundColor: ['#F97316', '#10B981', '#F59E0B', '#3B82F6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const dataset = context.dataset.data as number[];
                const total = dataset.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return ` ${value} ${this.texts.contactsLabel} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  ngOnDestroy(): void {
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }
}