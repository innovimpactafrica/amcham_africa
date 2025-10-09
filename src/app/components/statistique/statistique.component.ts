import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { StatisticsService, VueProfilData, ChronologieStats, VueProfilTotal, ContactRecuStats } from '../../../services/statistics.service';
import { CompanyService } from '../../../services/company.service'; // Import du service Membre
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-statistique',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderMembreComponent],
  templateUrl: './statistique.component.html'
})
export class StatistiqueComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart', { static: false }) lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChartInstance: Chart | null = null;
  private pieChartInstance: Chart | null = null;

  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  
  // Données dynamiques
  companyId: number | null = null;
  membreId: number | null = null; // Nouvelle propriété pour l'ID du membre
  membreUpdatedAt: string = ''; // Nouvelle propriété pour la date de mise à jour du membre
  vueProfilTotalData: VueProfilTotal | null = null;
  contactRecuData: ContactRecuStats | null = null;
  vueProfilChartData: VueProfilData[] = [];
  chronologieData: ChronologieStats | null = null;
  lastUpdateDate: string = '';
  isLoading: boolean = true;
  dataLoaded: boolean = false;
  errorMessage: string = '';
  chartsInitialized: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private statisticsService: StatisticsService,
    private authService: AuthService,
    private companyService: CompanyService, // Injection du service Membre
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
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
      noData: 'Aucune donnée disponible',
      errorLoading: 'Erreur lors du chargement des statistiques',
      sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
      noCompany: 'Aucune entreprise associée à votre compte',
      noMembre: 'Aucun membre associé à votre compte'
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
      noData: 'No data available',
      errorLoading: 'Error loading statistics',
      sessionExpired: 'Session expired. Please log in again.',
      noCompany: 'No company associated with your account',
      noMembre: 'No member associated with your account'
    };
  }

  // Métriques principales formatées - MODIFIÉ pour utiliser membreUpdatedAt
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
        // MODIFICATION ICI : Utilisation de membreUpdatedAt au lieu de lastUpdateDate
        valeur: this.membreUpdatedAt ? this.formatFullDate(this.membreUpdatedAt) : '--/--/----',
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
      if (this.dataLoaded && this.chartsInitialized) {
        this.updateChartsLanguage();
      }
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
  }

  ngAfterViewInit(): void {
    // Charger les données après que la vue soit initialisée
    this.loadUserAndStatistics();
  }

  /**
   * Charger les données de l'utilisateur pour récupérer le companyId et membreId dynamiquement
   */
  private loadUserAndStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Vérifier d'abord l'authentification
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = this.texts.sessionExpired;
      this.isLoading = false;
      this.cdRef.detectChanges();
      this.router.navigate(['/login']);
      return;
    }

    // Récupérer les informations utilisateur depuis l'API
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('✅ [Statistique] Utilisateur récupéré avec succès:', currentUser);
        
        // Vérifier si l'utilisateur a une entreprise associée
        if (!currentUser.companyId) {
          this.errorMessage = this.texts.noCompany;
          this.isLoading = false;
          this.cdRef.detectChanges();
          return;
        }

        this.companyId = currentUser.companyId;
        this.membreId = currentUser.id; // Récupération de l'ID du membre depuis l'utilisateur
        console.log('🔍 [Statistique] Chargement des statistiques pour companyId:', this.companyId, 'et membreId:', this.membreId);

        // Charger les statistiques avec le companyId récupéré et les données du membre
        this.loadAllStatistics();
      },
      error: (error) => {
        console.error('❌ [Statistique] Erreur lors de la récupération des informations utilisateur:', error);
        
        // Gestion des erreurs d'authentification
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = this.texts.sessionExpired;
          this.isLoading = false;
          this.cdRef.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = this.texts.errorLoading;
          this.isLoading = false;
          this.cdRef.detectChanges();
        }
      }
    });
  }

  private loadAllStatistics(): void {
    if (!this.companyId || !this.membreId) {
      this.errorMessage = !this.companyId ? this.texts.noCompany : this.texts.noMembre;
      this.isLoading = false;
      this.cdRef.detectChanges();
      return;
    }

    this.isLoading = true;

    // Charger toutes les statistiques en parallèle, y compris les données du membre
    Promise.all([
      this.loadVueProfilTotal(),
      this.loadContactRecu(),
      this.loadVueProfil(),
      this.loadChronologie(),
      this.loadMembreData() // NOUVELLE MÉTHODE pour charger les données du membre
    ]).then(() => {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.dataLoaded = true;
        
        // Initialiser les graphiques après le chargement des données
        this.initializeChartsWithRetry();
      });
    }).catch(error => {
      this.ngZone.run(() => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.errorMessage = this.texts.errorLoading;
        this.isLoading = false;
        this.dataLoaded = true;
      });
    });
  }

  /**
   * NOUVELLE MÉTHODE : Charger les données du membre pour récupérer updatedAt
   */
  private loadMembreData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.companyId) {
        reject(new Error('Membre ID non disponible'));
        return;
      }

      this.companyService.getCompanyById(this.companyId).subscribe({
        next: (company) => {
          // Stocker la date de mise à jour du membre
      
          this.membreUpdatedAt = company.updatedAt || '';
          console.log('✅ [Statistique] Données du membre chargées avec updatedAt:', this.membreUpdatedAt);
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données du membre:', error);
          // Ne pas rejeter pour ne pas bloquer le chargement des autres données
          // On continue même si les données du membre ne sont pas disponibles
          resolve();
        }
      });
    });
  }

  private initializeChartsWithRetry(retryCount: number = 0): void {
    const maxRetries = 3;
    
    const tryInitialize = () => {
      const lineReady = !!this.lineChartCanvas?.nativeElement;
      const pieReady = !!this.pieChartCanvas?.nativeElement;

      if (lineReady && pieReady) {
        console.log('🟢 Canvases disponibles, initialisation des graphiques...');
        this.initCharts();
      } else if (retryCount < maxRetries) {
        console.warn(`⚠️ Canvases pas encore prêts, réessai ${retryCount + 1}/${maxRetries} dans 300ms...`);
        setTimeout(() => this.initializeChartsWithRetry(retryCount + 1), 300);
      } else {
        console.error('❌ Échec de l\'initialisation des graphiques après plusieurs tentatives');
      }
    };

    // Premier essai avec un délai raisonnable
    setTimeout(() => tryInitialize(), 100);
  }

  private loadVueProfilTotal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.companyId) {
        reject(new Error('Company ID non disponible'));
        return;
      }

      this.statisticsService.getVueProfilTotal(this.companyId).subscribe({
        next: (data: any) => {
          this.vueProfilTotalData = data;
          console.log('✅ [Statistique] Vues profil total chargées:', data);
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
      if (!this.companyId) {
        reject(new Error('Company ID non disponible'));
        return;
      }

      this.statisticsService.getContactRecu(this.companyId).subscribe({
        next: (data) => {
          this.contactRecuData = data;
          console.log('✅ [Statistique] Contacts reçus chargés:', data);
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
      if (!this.companyId) {
        reject(new Error('Company ID non disponible'));
        return;
      }

      this.statisticsService.getVueProfil(this.companyId).subscribe({
        next: (data) => {
          this.vueProfilChartData = data;
          if (data.length > 0) {
            this.lastUpdateDate = this.formatFullDate(data[data.length - 1].date);
          }
          console.log('✅ [Statistique] Vues profil chargées:', data);
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
      if (!this.companyId) {
        reject(new Error('Company ID non disponible'));
        return;
      }

      this.statisticsService.getChronologie(this.companyId).subscribe({
        next: (data) => {
          this.chronologieData = data;
          console.log('✅ [Statistique] Chronologie chargée:', data);
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement de la chronologie:', error);
          reject(error);
        }
      });
    });
  }

  private initCharts(): void {
    console.log('🔄 Initialisation des graphiques...');
    
    // Utiliser NgZone pour exécuter en dehors du cycle Angular
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        if (this.lineChartCanvas?.nativeElement) {
          this.initLineChart();
        } else {
          console.warn('Canvas lineChart non disponible');
        }
        
        if (this.pieChartCanvas?.nativeElement) {
          this.initPieChart();
        } else {
          console.warn('Canvas pieChart non disponible');
        }
        
        this.chartsInitialized = true;
      }, 0);
    });
  }

  private initLineChart(): void {
    try {
      const canvas = this.lineChartCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D du canvas lineChart');
        return;
      }

      // Détruire le graphique existant s'il y en a un
      if (this.lineChartInstance) {
        this.lineChartInstance.destroy();
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

      this.lineChartInstance = new Chart(ctx, config);
      console.log('✅ Graphique linéaire initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du graphique linéaire:', error);
    }
  }

  private initPieChart(): void {
    try {
      const canvas = this.pieChartCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D du canvas pieChart');
        return;
      }

      // Détruire le graphique existant s'il y en a un
      if (this.pieChartInstance) {
        this.pieChartInstance.destroy();
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

      this.pieChartInstance = new Chart(ctx, config);
      console.log('✅ Graphique circulaire initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du graphique circulaire:', error);
    }
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
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      if (this.currentLang === 'fr') {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
      } else {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
      }
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateStr;
    }
  }

  private formatFullDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      if (this.currentLang === 'fr') {
        return date.toLocaleDateString('fr-FR');
      } else {
        return date.toLocaleDateString('en-US');
      }
    } catch (error) {
      console.error('Erreur de formatage de date complète:', error);
      return dateStr;
    }
  }

  private updateChartsLanguage(): void {
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
      this.lineChartInstance = null;
    }
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
      this.pieChartInstance = null;
    }
    
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  // Méthode pour rafraîchir les données
  refreshData(): void {
    this.isLoading = true;
    this.dataLoaded = false;
    this.chartsInitialized = false;
    this.errorMessage = '';
    
    // Réinitialiser les données
    this.vueProfilTotalData = null;
    this.contactRecuData = null;
    this.vueProfilChartData = [];
    this.chronologieData = null;
    this.membreUpdatedAt = ''; // Réinitialiser aussi la date du membre
    
    this.loadAllStatistics();
  }

  ngOnDestroy(): void {
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }
}