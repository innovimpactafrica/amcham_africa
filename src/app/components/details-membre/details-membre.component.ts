import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { LanguageService } from '../../../services/language.service';
import {
  CompanyService,
  Company,
  CompanySchedule,
  Ratings,
  CreateRatingRequest,
} from '../../../services/company.service';
import {
  HomeService,
  Company as HomeCompany,
} from '../../../services/home.service';
import { Subject, Subscription, forkJoin, switchMap, takeUntil } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface MembreDisplay {
  id: number;
  name: string;
  categoryFr: string;
  categoryEn: string;
  locationFr: string;
  locationEn: string;
  phone: string;
  website: string;
  descriptionFr: string;
  descriptionEn: string;
  logo: string;
  pictures: string[];
  address?: string;
  email?: string;
  country?: string;
  countryAmcham?: string;
  city?: string;
}

@Component({
  selector: 'app-details-membre',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './details-membre.component.html',
  styleUrls: ['./details-membre.component.css'],
})
export class DetailsMembreComponent implements OnInit, OnDestroy {
  private langSubscription!: Subscription;
  currentLang = 'fr';
  displayedRatings: Ratings[] = [];
  currentRatinIndex: number = 0;
  noTransition: boolean = false;
  private ratingInterval?: any;
  membreId: number = 0;
  membre: Company | null = null;
  horaires: CompanySchedule[] = [];
  ratings: Ratings[] = [];
  membresSimilaires: MembreDisplay[] = [];
  isLoading = true;
  mapUrl: SafeResourceUrl | null = null;


  // ===== PROPRIÉTÉS POUR LA POPUP D'AVIS =====
  showReviewModal: boolean = false;
  showSuccessModal: boolean = false;
  isSubmittingReview: boolean = false;
  reviewError: string = '';
  hoverScore: number = 0;

  private carouselInterval: any = null; // ✅ "private" corrige l’erreur d’accès

  itemsPerView = 1; // Nombre d’éléments visibles en même temps (mobile = 1, desktop = 2-3)
  translatePercent = 0; // Position actuelle du carrousel (pour transform: translateX)

  reviewForm = {
    firstName: '',
    lastName: '',
    email: '',
    score: 0,
    comment: '',
  };

  certificationsSimules = [
    'ISO 9001:2015',
    'SOC 2 Type II',
    'AWS Partner',
    'Microsoft Gold Partner',
  ];

  servicesSimulesFr = [
    "Développement d'applications web et mobiles",
    'Solutions cloud et infrastructure',
    'Intelligence artificielle et machine learning',
    'Consultation technologique',
    'Support et maintenance',
  ];

  servicesSimulesEn = [
    'Web and mobile application development',
    'Cloud solutions and infrastructure',
    'Artificial intelligence and machine learning',
    'Technology consulting',
    'Support and maintenance',
  ];
  private destroy$ = new Subject<void>();
  reviewSuccess: any;
  get texts() {
    return this.currentLang === 'fr'
      ? {
          giveReview: 'Donner un avis',
          founded: 'Fondée en',
          employees: 'actifs',
          coordinates: 'Coordonnées',
          address: 'Adresse',
          phone: 'Téléphone',
          email: 'Email',
          website: 'Site web',
          contact: 'Contacter',
          openingHours: "Horaires d'ouverture",
          closed: 'Fermé',
          presentation: 'Présentation',
          services: 'Services proposés',
          certifications: 'Certifications & Labels',
          photoGallery: 'Galerie photos',
          presentationVideo: 'Vidéo de présentation',
          clickToWatch: 'Cliquer pour voir la vidéo',
          location: 'Localisation',
          viewOnMap: 'Voir sur la carte',
          reviews: 'Avis & notes',
          similarMembers: 'Membres similaires',
          seeAllMembers: 'Voir tous les membres',
          memberNotFound: 'Membre non trouvé',
          memberNotFoundDesc:
            "Le membre que vous cherchez n'existe pas ou a été supprimé.",
          seeAllMembersBtn: 'Voir tous les membres',
          contactBtn: 'Contacter',
          viewProfile: 'Voir la fiche',
          monday: 'Lundi',
          tuesday: 'Mardi',
          wednesday: 'Mercredi',
          thursday: 'Jeudi',
          friday: 'Vendredi',
          saturday: 'Samedi',
          sunday: 'Dimanche',
          discoverMembers:
            'Découvrez quelques-uns de nos membres et explorez les opportunités de collaboration',
          avis: 'avis',
          review: 'review',
          reviewsPlural: 'reviews',
        }
      : {
          giveReview: 'Give review',
          founded: 'Founded in',
          employees: 'employees',
          coordinates: 'Contact Information',
          address: 'Address',
          phone: 'Phone',
          email: 'Email',
          website: 'Website',
          contact: 'Contact',
          openingHours: 'Opening Hours',
          closed: 'Closed',
          presentation: 'Presentation',
          services: 'Services Offered',
          certifications: 'Certifications & Labels',
          photoGallery: 'Photo Gallery',
          presentationVideo: 'Presentation Video',
          clickToWatch: 'Click to watch video',
          location: 'Location',
          viewOnMap: 'View on map',
          reviews: 'Reviews & Ratings',
          similarMembers: 'Similar Members',
          seeAllMembers: 'See all members',
          memberNotFound: 'Member not found',
          memberNotFoundDesc:
            'The member you are looking for does not exist or has been deleted.',
          seeAllMembersBtn: 'See all members',
          contactBtn: 'Contact',
          viewProfile: 'View profile',
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
          sunday: 'Sunday',
          discoverMembers:
            'Discover some of our members and explore collaboration opportunities',
          avis: 'review',
          review: 'review',
          reviewsPlural: 'reviews',
        };
  }

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private languageService: LanguageService,
    private companyService: CompanyService,
    private homeService: HomeService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.route.params
      .pipe(
        switchMap((params) => {
          this.membreId = +params['id'];
          this.isLoading = true;
          return forkJoin({
            company: this.companyService.getCompanyById(this.membreId),
            schedules: this.companyService.getHoraire(this.membreId),
            //ratings: this.loadRatings() // ajouté ici
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ company, schedules }) => {
          this.membre = company;
          this.horaires = schedules;

          this.isLoading = false;

          this.loadMembresSimilaires();
          this.initializeMap();
          this.loadRatings();
          // gérer le carousel ratings ici
        },
        error: () => {
          this.isLoading = false;
        },
      });

    this.langSubscription = this.languageService.currentLang$.subscribe(
      (lang) => {
        this.currentLang = lang;
      }
    );
    /*this.route.params.subscribe(params => {
      this.membreId = +params['id'];
      this.loadMembreDetails();
      
    });*/

    this.langSubscription = this.languageService.currentLang$.subscribe(
      (lang) => {
        this.currentLang = lang;
      }
    );

    this.currentLang = this.languageService.getCurrentLanguage();
  }

  // ===== MÉTHODE POUR OUVRIR LA POPUP =====
  laisserAvis() {
    this.resetReviewForm();
    this.showReviewModal = true;
  }

  // ===== MÉTHODE POUR FERMER LA POPUP =====
  closeReviewModal() {
    this.showReviewModal = false;
    this.reviewError = '';
    this.resetReviewForm();
  }

  // ===== MÉTHODE POUR FERMER LE MODAL DE SUCCÈS =====
  closeSuccessModal() {
    this.showSuccessModal = false;
  }
  private resetReviewForm(): void {
    this.reviewForm = {
      firstName: '',
      lastName: '',
      email: '',
      score: 0,
      comment: '',
    };
    this.reviewError = '';
    this.hoverScore = 0;
  }

  ngOnDestroy(): void {
    this.stopRatingCarousel();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.ratingInterval) {
      clearInterval(this.ratingInterval);
    }
  }

  // Méthode pour initialiser la carte Google Maps
  private initializeMap(): void {
    if (this.membre?.lat && this.membre?.lon) {
      const url = `https://www.google.com/maps?q=${this.membre.lat},${this.membre.lon}&hl=${this.currentLang}&z=15&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      console.log(
        'Carte initialisée avec les coordonnées:',
        this.membre.lat,
        this.membre.lon
      );
    } else {
      console.warn('Coordonnées GPS non disponibles pour ce membre');
      this.mapUrl = null;
    }
  }
  private mapSimilarCompanyToMembreDisplay(company: any): MembreDisplay {
    return {
      id: company.id,
      name: company.name || 'N/A',
      categoryFr: company.sector || 'N/A',
      categoryEn: company.sector || 'N/A',
      locationFr: company.country || 'N/A',
      locationEn: company.country || 'N/A',
      phone: company.telephone || 'N/A',
      website: company.webLink || 'N/A',
      descriptionFr: company.description || '',
      descriptionEn: company.description || '',

      logo: company.logo || '',
      pictures: company.pictures || [],
      address: company.address || 'N/A',
      email: company.email || 'N/A',
      country: company.country || 'N/A',
      countryAmcham: company.countryAmcham || 'N/A',

      // ... mapping complet avec gestion des propriétés manquantes
      city: company.city || '', // Gestion de la propriété city
    };
  }
  loadMembresSimilaires() {
    this.companyService.getSimilarCompanies(this.membreId).subscribe({
      next: (companies) => {
        this.membresSimilaires = companies
          .filter((c) => c.id !== this.membreId)
          .slice(0, 3) // Limiter à 3 membres
          .map((c) => this.mapSimilarCompanyToMembreDisplay(c));
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des membres similaires:',
          error
        );
        this.membresSimilaires = [];
      },
    });
  }

  private mapCompanyToMembreDisplay(company: HomeCompany): MembreDisplay {
    return {
      id: company.id,
      name: company.name,
      categoryFr: company.sector,
      categoryEn: company.sector,
      locationFr: company.country,
      locationEn: company.country,
      phone: company.telephone || 'N/A',
      website: company.webLink || 'N/A',
      descriptionFr: company.description || '',
      descriptionEn: company.description || '',
      logo: company.logo,
      pictures: company.pictures || [],
      address: company.address,
      email: company.email,
      country: company.country,
      countryAmcham: company.countryAmcham,
    };
  }

  getSafeVideoUrl(): SafeResourceUrl | null {
    if (!this.membre?.videoLink) return null;
    // Convert YouTube watch URL to embed URL
    const videoId = this.membre.videoLink.split('v=')[1]?.split('&')[0];
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : this.membre.videoLink;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  getAverageRating(): number {
    if (!this.ratings || this.ratings.length === 0) {
      return 0;
    }
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    const average = sum / this.ratings.length;
    return Math.round(average * 10) / 10;
  }

  getTotalReviews(): number {
    return this.ratings ? this.ratings.length : 0;
  }

  getReviewText(): string {
    const count = this.getTotalReviews();
    if (this.currentLang === 'fr') {
      return count <= 1 ? this.texts.avis : this.texts.avis;
    } else {
      return count <= 1 ? this.texts.review : this.texts.reviewsPlural;
    }
  }

  getFormattedHoraires(): any {
    const horairesObj: any = {};
    this.horaires.forEach((schedule) => {
      const dayKey = this.getTranslatedDay(schedule.dayOfWeek);
      if (schedule.closed) {
        horairesObj[dayKey] = this.texts.closed;
      } else if (schedule.openingTime && schedule.closingTime) {
        horairesObj[
          dayKey
        ] = `${schedule.openingTime} - ${schedule.closingTime}`;
      } else {
        horairesObj[dayKey] = this.texts.closed;
      }
    });
    return horairesObj;
  }

  getTranslatedDay(day: string): string {
    const daysMap: { [key: string]: { fr: string; en: string } } = {
      MONDAY: { fr: 'Lundi', en: 'Monday' },
      TUESDAY: { fr: 'Mardi', en: 'Tuesday' },
      WEDNESDAY: { fr: 'Mercredi', en: 'Wednesday' },
      THURSDAY: { fr: 'Jeudi', en: 'Thursday' },
      FRIDAY: { fr: 'Vendredi', en: 'Friday' },
      SATURDAY: { fr: 'Samedi', en: 'Saturday' },
      SUNDAY: { fr: 'Dimanche', en: 'Sunday' },
    };
    return this.currentLang === 'fr'
      ? daysMap[day]?.fr || day
      : daysMap[day]?.en || day;
  }

  getTranslatedDays(): string[] {
    return this.currentLang === 'fr'
      ? [
          'Lundi',
          'Mardi',
          'Mercredi',
          'Jeudi',
          'Vendredi',
          'Samedi',
          'Dimanche',
        ]
      : [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ];
  }

  getServices(): string[] {
    return this.currentLang === 'fr'
      ? this.servicesSimulesFr
      : this.servicesSimulesEn;
  }

  getCompleteAddress(): string {
    if (!this.membre) return '';
    const addressParts = [
      this.membre.address,
      this.membre.city,
      this.membre.country,
    ].filter((part) => part && part.trim() !== '');
    return addressParts.join(', ');
  }

  contactMembre(membre: MembreDisplay): void {
    if (membre.email) {
      window.location.href = `mailto:${membre.email}`;
    } else {
      console.log('Contacter:', membre.name);
    }
  }

  voirFiche(membreId: number) {
    this.router.navigate(['/membre', membreId]);
  }
  submitReview(): void {
    if (!this.isReviewFormValid() || !this.membre) {
      this.reviewError =
        this.currentLang === 'fr'
          ? 'Veuillez remplir tous les champs obligatoires'
          : 'Please fill in all required fields';
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = '';

    // Préparation des données pour l'API
    const ratingRequest: CreateRatingRequest = {
      firstName: this.reviewForm.firstName.trim() || 'Anonyme',
      lastName: this.reviewForm.lastName.trim() || '',
      score: this.reviewForm.score,
      comment: this.reviewForm.comment.trim(),
      companyId: this.membre.id, // ID du membre depuis le membre chargé
    };

    // Appel du service
    this.companyService.saveRating(ratingRequest).subscribe({
      next: (response) => {
        console.log('Avis envoyé avec succès:', response);
        this.isSubmittingReview = false;

        // Fermer la modal de formulaire
        this.showReviewModal = false;

        // Afficher le modal de succès
        this.showSuccessModal = true;

        // Fermer le modal de succès après 3 secondes
        setTimeout(() => {
          this.closeSuccessModal();
          // Recharger les avis pour afficher le nouveau
          this.loadMembreDetails();
        }, 3000);
      },
      error: (error) => {
        console.error("Erreur lors de l'envoi de l'avis:", error);
        this.isSubmittingReview = false;
        this.reviewError =
          this.currentLang === 'fr'
            ? "Une erreur s'est produite lors de l'envoi de votre avis. Veuillez réessayer."
            : 'An error occurred while submitting your review. Please try again.';
      },
    });
  }

  // ===== VALIDATION DU FORMULAIRE =====
  isReviewFormValid(): boolean {
    return (
      this.reviewForm.firstName.trim() !== '' &&
      this.reviewForm.lastName.trim() !== '' &&
      this.reviewForm.score > 0 &&
      this.reviewForm.comment.trim() !== '' &&
      this.reviewForm.comment.length >= 2
    );
  }

  loadMembreDetails() {
    this.isLoading = true;
    forkJoin({
      company: this.companyService.getCompanyById(this.membreId),
      schedules: this.companyService.getHoraire(this.membreId),
    }).subscribe({
      next: ({ company, schedules }) => {
        this.membre = company;
        console.log('Données du membre:', this.membre);
        this.horaires = schedules;
        this.isLoading = false;

        // Initialiser la carte après avoir chargé les données du membre
        this.initializeMap();

        this.companyService.getRatings(this.membreId).subscribe({
          next: (ratings) => {
            this.ratings = ratings;
            if (this.ratings.length < 3) {
              while (this.ratings.length < 3) {
                this.ratings = [
                  ...this.ratings,
                  ...this.ratings.slice(0, 3 - this.ratings.length),
                ];
              }
              this.displayedRatings = this.ratings;
            } else {
              this.displayedRatings = [
                ...this.ratings.slice(-2),
                ...this.ratings,
                ...this.ratings.slice(0, 2),
              ];
              this.currentRatinIndex = 2;
              this.startRatingCarousel();
            }
          },
          error: (error) => {
            console.warn(
              'Aucun rating disponible pour cette entreprise',
              error
            );
            this.ratings = [];
            this.displayedRatings = [];
          },
        });
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des données du membre:',
          error
        );
        this.isLoading = false;
        this.router.navigate(['/membres']);
      },
    });
  }
  voirTousLesMembres() {
    this.router.navigate(['/membres']);
  }

  getStarsArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < rating ? 1 : 0));
  }

  openMap() {
    if (!this.membre) return;
    const encodedAddress = encodeURIComponent(this.getCompleteAddress());
    window.open(
      `https://www.google.com/maps/search/${encodedAddress}`,
      '_blank'
    );
  }

  callPhone() {
    if (!this.membre) return;
    window.location.href = `tel:${this.membre.telephone}`;
  }

  sendEmail() {
    if (!this.membre) return;
    window.location.href = `mailto:${this.membre.email}`;
  }

  visitWebsite() {
    if (!this.membre) return;
    let website = this.membre.webLink;
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      website = 'https://' + website;
    }
    window.open(website, '_blank');
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  getMemberImageUrl(picture: string): string {
    return this.homeService.getCompanyImageUrl(picture);
  }

  getTranslatedProperty(membre: MembreDisplay, property: string): string {
    const langSuffix = this.currentLang === 'fr' ? 'Fr' : 'En';
    const key = `${property}${langSuffix}` as keyof MembreDisplay;
    return (membre[key] as string) || '';
  }

  nextRating() {
    if (this.displayedRatings.length === 0) return;

    // 🔥 CORRECTION : Logique de carrousel infini
    this.currentRatinIndex++;

    // Si on arrive à la fin du tableau étendu, revenir au début sans transition
    if (this.currentRatinIndex >= this.displayedRatings.length - 1) {
      setTimeout(() => {
        this.noTransition = true;
        this.currentRatinIndex = 1;
        setTimeout(() => {
          this.noTransition = false;
        }, 50);
      }, 0);
    }
  }

  //  CORRECTION : Méthode pour obtenir le dot actif
getActiveDot(): number {
  if (this.ratings.length === 0) return 0;

  const totalGroups = Math.ceil(this.ratings.length / this.itemsPerView);
  const activeGroup = Math.floor(this.currentRatinIndex / this.itemsPerView);

  return activeGroup % totalGroups;
}

getDots(): number[] {
  const totalGroups = Math.ceil(this.ratings.length / this.itemsPerView);
  return Array.from({ length: totalGroups }, (_, i) => i);
}
  private createDefaultRating(): Ratings {
    return {
      firstName: 'Anonymous',
      lastName: '',
      companyName: '',
      score: 5,
      comment: 'No reviews yet.',
    };
  }

  // Calcule itemsPerView selon la largeur viewport
  private calculateItemsPerView() {
    const w = window.innerWidth;
    if (w >= 1024) {
      this.itemsPerView = 3; // lg -> 3 par vue
    } else if (w >= 640) {
      this.itemsPerView = 2; // sm -> 2 par vue
    } else {
      this.itemsPerView = 1; // mobile -> 1 par vue
    }
  }

  // Prépare displayedRatings et évite les espaces vides
  private setupCarousel() {
    // determine itemsPerView
    this.calculateItemsPerView();

    // si pas de ratings -> fallback
    if (!this.ratings || this.ratings.length === 0) {
      this.ratings = [this.createDefaultRating()];
    }

    // si on a moins d'items que itemsPerView, dupliquer jusqu'à remplir (évite blancs)
    const needed =
      this.itemsPerView - (this.ratings.length % this.itemsPerView);
    if (this.ratings.length < this.itemsPerView) {
      // clone autant que nécessaire pour atteindre itemsPerView
      this.displayedRatings = [...this.ratings];
      while (this.displayedRatings.length < this.itemsPerView) {
        this.displayedRatings.push(...this.ratings.map((r) => ({ ...r })));
      }
    } else {
      // sinon on peut juste utiliser la liste telle quelle
      this.displayedRatings = [...this.ratings];
    }

    // reset index et calcul translate
    this.currentRatinIndex= 0;
    this.updateTranslate();
  }

  // met à jour translatePercent en fonction du currentIndex et itemsPerView
  private updateTranslate() {
    // Chaque “pas” doit correspondre à la largeur d'un item (100 / itemsPerView)
    // Nous voulons glisser d'un "item group" (itemsPerView) à la fois -> translate = currentIndex * (100 / itemsPerView)
    this.translatePercent = +(
      this.currentRatinIndex *
      (100 / this.itemsPerView)
    ).toFixed(4);
    

  }

  // démarre le carousel (auto-play)
  private startRatingCarousel(intervalMs = 4000) {
    this.stopRatingCarousel(); // s'assurer qu'il n'y ait pas 2 intervals
    if (!this.displayedRatings || this.displayedRatings.length === 0) return;

    const maxIndex =
      Math.ceil(this.displayedRatings.length / this.itemsPerView) - 1;
    this.carouselInterval = setInterval(() => {
      this.noTransition = false; // on veut la transition normale
      this.currentRatinIndex =
        this.currentRatinIndex+ 1 > maxIndex ? 0 : this.currentRatinIndex + 1;
      this.updateTranslate();
    }, intervalMs);
  }

  // stop proprement
  private stopRatingCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  // trackBy pour ngFor
  trackByIndex(index: number, item: Ratings) {
    return index;
  }

  // gestion resize pour recalculer itemsPerView et réajuster
  private handleResize = () => {
    const prev = this.itemsPerView;
    this.calculateItemsPerView();
    if (prev !== this.itemsPerView) {
      // recalculer displayedRatings pour éviter trous
      this.setupCarousel();
    }
  };

  // Appel initial pour charger les ratings (exemple)
  private loadRatings() {
    this.companyService
      .getRatings(this.membreId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ratings) => {
          if (!ratings || ratings.length === 0) {
            this.ratings = [this.createDefaultRating()];
          } else {
            this.ratings = ratings;
          }
          this.setupCarousel();
          this.startRatingCarousel();
        },
        error: () => {
          this.ratings = [this.createDefaultRating()];
          this.setupCarousel();
          this.startRatingCarousel();
        },
      });
  }
}
