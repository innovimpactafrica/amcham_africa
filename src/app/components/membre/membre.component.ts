import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../services/language.service';
import { HomeService, Company } from '../../../services/home.service';
import { SecteurService, Country, SecteurResponse } from '../../../services/secteur.service';
import { Subscription } from 'rxjs';

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
}

@Component({
  selector: 'app-membre',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './membre.component.html',
  styleUrls: ['./membre.component.css'],
})
export class MembreComponent implements OnInit, OnDestroy {
  private langSubscription!: Subscription;
  currentLang = 'fr';

  // Filtres
  searchTerm: string = '';
  selectedCountryId: number | undefined;
  selectedSectorId: number | undefined;

  // États de chargement
  isLoading = false;
  isSearching = false;
  error: string | null = null;

  // Données dynamiques
  allMembres: MembreDisplay[] = [];
  filteredMembres: MembreDisplay[] = [];
  
  // Listes pour les dropdowns
  countries: Country[] = [];
  sectors: SecteurResponse[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 9;
  totalElements = 0;
  hasMore = false;

  // ID du pays AMCHAM
  countryAmchamId = 1;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      heroTitle: 'Trouvez des partenaires commerciaux',
      heroSubtitle: 'Utilisez notre outil de recherche avancée pour trouver des membres par nom, secteur d\'activité ou localisation',
      memberName: 'Nom du membre',
      memberPlaceholder: 'E.S. Amcham SN',
      country: 'Pays',
      sector: 'Secteur d\'activité',
      search: 'Rechercher',
      ourMembers: 'Nos membres',
      membersDisplayed: 'membres affichés',
      noMembersFound: 'Aucun membre trouvé',
      noMembersDesc: 'Essayez de modifier vos critères de recherche pour obtenir plus de résultats.',
      resetFilters: 'Réinitialiser les filtres',
      contact: 'Contacter',
      viewProfile: 'Voir la fiche',
      seeMore: 'Voir plus',
      location: 'Localisation',
      phone: 'Téléphone',
      website: 'Site web',
      allCountries: 'Tous les pays',
      allSectors: 'Tous les secteurs',
      loading: 'Chargement...',
      errorLoading: 'Erreur lors du chargement des membres'
    } : {
      heroTitle: 'Find business partners',
      heroSubtitle: 'Use our advanced search tool to find members by name, business sector or location',
      memberName: 'Member name',
      memberPlaceholder: 'E.S. Amcham SN',
      country: 'Country',
      sector: 'Business sector',
      search: 'Search',
      ourMembers: 'Our members',
      membersDisplayed: 'members displayed',
      noMembersFound: 'No members found',
      noMembersDesc: 'Try adjusting your search criteria to get more results.',
      resetFilters: 'Reset filters',
      contact: 'Contact',
      viewProfile: 'View profile',
      seeMore: 'See more',
      location: 'Location',
      phone: 'Phone',
      website: 'Website',
      allCountries: 'All countries',
      allSectors: 'All sectors',
      loading: 'Loading...',
      errorLoading: 'Error loading members'
    };
  }

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private homeService: HomeService,
    private secteurService: SecteurService
  ) { }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();

    // Charger les données initiales
    this.loadCountriesAndSectors();
    this.loadMembres();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger les pays et secteurs pour les filtres
   */
  loadCountriesAndSectors(): void {
    this.secteurService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays:', error);
      }
    });

    this.secteurService.getAllSecteurs().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des secteurs:', error);
      }
    });
  }

  /**
   * Charger les membres depuis l'API
   */
  loadMembres(append: boolean = false): void {
    this.isLoading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      size: this.pageSize
    };

    this.homeService.getMembres(params).subscribe({
      next: (response) => {
        const newMembres = response.content.map(company => this.mapCompanyToMembreDisplay(company));
        
        if (append) {
          this.allMembres = [...this.allMembres, ...newMembres];
        } else {
          this.allMembres = newMembres;
        }
        
        this.filteredMembres = [...this.allMembres];
        this.totalElements = response.totalElements;
        this.hasMore = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.error = this.texts.errorLoading;
        this.isLoading = false;
      }
    });
  }

  /**
   * Mapper les données Company vers MembreDisplay
   */
  private mapCompanyToMembreDisplay(company: Company): MembreDisplay {
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
      countryAmcham: company.countryAmcham
    };
  }

  /**
   * Rechercher avec filtres
   */
  rechercher(): void {
    this.isSearching = true;
    this.error = null;
    this.currentPage = 0;

    const searchParams: any = {
      page: this.currentPage,
      size: this.pageSize
    };

    // Ajouter le nom si renseigné
    if (this.searchTerm && this.searchTerm.trim()) {
      searchParams.name = this.searchTerm.trim();
    }

    // Ajouter le secteur si sélectionné
    if (this.selectedSectorId) {
      const selectedSector = this.sectors.find(s => s.id === this.selectedSectorId);
      if (selectedSector) {
        searchParams.sector = this.currentLang === 'fr' ? selectedSector.nameFr : selectedSector.nameEn;
      }
    }

    // Ajouter le pays si sélectionné
    if (this.selectedCountryId) {
      const selectedCountry = this.countries.find(c => c.id === this.selectedCountryId);
      if (selectedCountry) {
        searchParams.country = selectedCountry.name;
      }
    }

    this.homeService.getMembres(searchParams).subscribe({
      next: (response) => {
        this.allMembres = response.content.map(company => this.mapCompanyToMembreDisplay(company));
        this.filteredMembres = [...this.allMembres];
        this.totalElements = response.totalElements;
        this.hasMore = !response.last;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.error = this.currentLang === 'fr' 
          ? 'Une erreur est survenue lors de la recherche. Veuillez réessayer.' 
          : 'An error occurred during the search. Please try again.';
        this.isSearching = false;
      }
    });
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCountryId = undefined;
    this.selectedSectorId = undefined;
    this.currentPage = 0;
    this.loadMembres();
  }

  /**
   * Charger plus de membres (pagination)
   */
  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadMembres(true);
    }
  }

  /**
   * Navigation vers les détails d'un membre
   */
  navigateToMembreDetails(membreId: number): void {
    this.router.navigate(['/membre', membreId]);
  }

  /**
   * Méthode pour contacter un membre
   */
  contactMembre(membre: MembreDisplay): void {
    if (membre.email) {
      window.location.href = `mailto:${membre.email}`;
    } else {
      console.log('Contacter:', membre.name);
    }
  }

  /**
   * Obtenir la propriété traduite d'un membre
   */
  getTranslatedProperty(membre: MembreDisplay, property: string): string {
    const langSuffix = this.currentLang === 'fr' ? 'Fr' : 'En';
    const key = `${property}${langSuffix}` as keyof MembreDisplay;
    return (membre[key] as string) || '';
  }

  /**
   * Obtenir le nom du secteur traduit
   */
  getSectorName(sector: SecteurResponse): string {
    return this.currentLang === 'fr' ? sector.nameFr : sector.nameEn;
  }
  getMemberImageUrl(picture: string): string {
    return this.homeService.getCompanyImageUrl(picture);
  }
  /**
   * Obtenir l'URL du logo
   */
  getLogoUrl(pictures: string[]): string {
    if (pictures && pictures.length > 0) {
      return this.homeService.getCompanyImageUrl(pictures[0]);
    }
    return '/assets/default-company-logo.png';
  }
}