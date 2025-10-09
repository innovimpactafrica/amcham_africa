import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { LanguageService } from '../../../services/language.service';
import { CountryAmchamService, CountryAmchamResponse, Country } from '../../../services/country-amcham.service';
import { Subscription } from 'rxjs';
import { CardStateComponent } from "../card-state/card-state.component";

@Component({
  selector: 'app-amchams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './amchams.component.html',
  styleUrls: ['./amchams.component.css']
})
export class AmchamsComponent implements OnInit, OnDestroy {
  showAddAmchamModal = false;
  amchamForm!: FormGroup;
  amchams: CountryAmchamResponse[] = [];
  countries: Country[] = [];
  filteredAmchams: CountryAmchamResponse[] = [];
  searchTerm = '';
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  isLoading = false;
  isEditMode = false;
  selectedAmchamId: number | null = null;
  selectedFile: File | null = null;
  errorMessage = '';
  successMessage = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 0;
  searchKeyword: any;

  // Statistiques calculées
  get stats() {
    const totalAmchams = this.amchams.length;
    const lastMonthAmchams = this.amchams.filter(a => {
      const amchamDate = new Date(a.id);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return amchamDate > lastMonth;
    }).length;
    
    return {
      totalAmchams,
      lastMonthAmchams,
      amchamGrowth: totalAmchams > 0 ? Math.round((lastMonthAmchams / totalAmchams) * 100) : 0,
      searches: 1243,
      lastWeekSearches: 62,
      searchGrowth: 5,
      adClicks: 348,
      lastMonthClicks: 63,
      clickGrowth: 18
    };
  }

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      amchamsManagement: 'Gestion des Amchams',
      totalAmchams: 'Amchams totaux',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      searchPlaceholder: 'Rechercher ici...',
      allCountries: 'Tous les pays',
      addAmcham: 'Ajouter un pays',
      name: 'Nom',
      country: 'Pays',
      email: 'Email',
      phone: 'Téléphone',
      date: 'Date',
      actions: 'Actions',
      newAmcham: 'Nouveau Amcham',
      editAmcham: 'Modifier Amcham',
      amchamName: 'Nom de l\'Amcham',
      amchamCountry: 'Pays de l\'Amcham',
      amchamAddress: 'Adresse de l\'Amcham',
      amchamPhone: 'Téléphone de l\'Amcham',
      amchamEmail: 'Email de l\'Amcham',
      website: 'Site Web',
      logo: 'Logo',
      chooseFile: 'Choisir un fichier',
      noFileChosen: 'Aucun fichier choisi',
      save: 'Enregistrer',
      cancel: 'Annuler',
      select: 'Sélectionner',
      view: 'Voir',
      edit: 'Modifier',
      delete: 'Supprimer',
      loading: 'Chargement...',
      noAmchamsFound: 'Aucun Amcham trouvé',
      tryDifferentSearch: 'Essayez de modifier vos critères de recherche',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet Amcham ?',
      deleteSuccess: 'Amcham supprimé avec succès',
      saveSuccess: 'Amcham enregistré avec succès',
      updateSuccess: 'Amcham modifié avec succès',
      error: 'Une erreur est survenue',
      showing: 'Affichage de',
      to: 'à',
      of: 'sur',
      results: 'résultats',
      previous: 'Précédent',
      next: 'Suivant'
    } : {
      amchamsManagement: 'Amchams Management',
      totalAmchams: 'Total Amchams',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      searchPlaceholder: 'Search here...',
      allCountries: 'All countries',
      addAmcham: 'Add Country',
      name: 'Name',
      country: 'Country',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      actions: 'Actions',
      newAmcham: 'New Amcham',
      editAmcham: 'Edit Amcham',
      amchamName: 'Amcham Name',
      amchamCountry: 'Amcham Country',
      amchamAddress: 'Amcham Address',
      amchamPhone: 'Amcham Phone',
      amchamEmail: 'Amcham Email',
      website: 'Website',
      logo: 'Logo',
      chooseFile: 'Choose File',
      noFileChosen: 'No file chosen',
      save: 'Save',
      cancel: 'Cancel',
      select: 'Select',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      loading: 'Loading...',
      noAmchamsFound: 'No Amchams found',
      tryDifferentSearch: 'Try modifying your search criteria',
      confirmDelete: 'Are you sure you want to delete this Amcham?',
      deleteSuccess: 'Amcham deleted successfully',
      saveSuccess: 'Amcham saved successfully',
      updateSuccess: 'Amcham updated successfully',
      error: 'An error occurred',
      showing: 'Showing',
      to: 'to',
      of: 'of',
      results: 'results',
      previous: 'Previous',
      next: 'Next'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private countryAmchamService: CountryAmchamService
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    this.loadCountries();
    this.loadAmchams();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.amchamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      countryId: ['', [Validators.required]],
      address: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      website: ['', [Validators.pattern('https?://.+')]],
      logoFile: [null]
    });
  }

  loadCountries(): void {
    this.countryAmchamService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays:', error);
        this.showError(error.message || this.texts.error);
      }
    });
  }

  loadAmchams(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.countryAmchamService.getAllCountryAmchams().subscribe({
      next: (response: any) => {
        console.log('Réponse complète:', response);
        
        // Vérification plus robuste
        if (response?.content && Array.isArray(response.content)) {
          this.amchams = response.content as CountryAmchamResponse[];
          console.log('Liste des Amchams chargée:', this.amchams);
          this.filterAmchams();
        } else {
          console.error('Format de réponse inattendu:', response);
          this.amchams = [];
          this.filteredAmchams = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des Amchams:', error);
        this.showError(error.message || this.texts.error);
        this.isLoading = false;
      }
    });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 1; // Réinitialiser à la première page lors de la recherche
    this.filterAmchams();
  }

  filterAmchams(): void {
    // S'assurer que this.amchams est un tableau avant de filtrer
    if (!Array.isArray(this.amchams)) {
      console.error('this.amchams n\'est pas un tableau:', this.amchams);
      this.filteredAmchams = [];
      return;
    }
  
    if (!this.searchKeyword) {
      this.filteredAmchams = [...this.amchams];
      return;
    }
  
    this.filteredAmchams = this.amchams.filter(amcham =>
      amcham.countryName && amcham.countryName.toLowerCase().includes(this.searchKeyword.toLowerCase())
    );
  }

  // Obtenir les Amchams pour la page actuelle
  get paginatedAmchams(): CountryAmchamResponse[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAmchams.slice(startIndex, endIndex);
  }

  // Navigation pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Générer le tableau des numéros de pages
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // Informations de pagination
  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredAmchams.length);
    const total = this.filteredAmchams.length;
    
    return `${this.texts.showing} ${start} ${this.texts.to} ${end} ${this.texts.of} ${total} ${this.texts.results}`;
  }

  openAddAmchamModal(): void {
    this.isEditMode = false;
    this.selectedAmchamId = null;
    this.showAddAmchamModal = true;
    this.amchamForm.reset();
    this.selectedFile = null;
    this.errorMessage = '';
  }

  closeAddAmchamModal(): void {
    this.showAddAmchamModal = false;
    this.isEditMode = false;
    this.selectedAmchamId = null;
    this.amchamForm.reset();
    this.selectedFile = null;
    this.errorMessage = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showError('Le fichier est trop volumineux (max 5MB)');
        event.target.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.showError('Veuillez sélectionner une image');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      
      const fileNameSpan = document.getElementById('file-name');
      if (fileNameSpan) {
        fileNameSpan.textContent = file.name;
      }
    }
  }

  onSubmit(): void {
    if (this.amchamForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = {
        countryId: this.amchamForm.get('countryId')?.value,
        name: this.amchamForm.get('name')?.value,
        address: this.amchamForm.get('address')?.value,
        telephone: this.amchamForm.get('telephone')?.value,
        email: this.amchamForm.get('email')?.value,
        website: this.amchamForm.get('website')?.value || '',
        logoFile: this.selectedFile || undefined
      };

      if (this.isEditMode && this.selectedAmchamId) {
        this.countryAmchamService.updateCountryAmcham(this.selectedAmchamId, formData).subscribe({
          next: (response) => {
            this.showSuccess(this.texts.updateSuccess);
            this.loadAmchams();
            this.closeAddAmchamModal();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.showError(error.message || this.texts.error);
            this.isLoading = false;
          }
        });
      } else {
        this.countryAmchamService.saveCountryAmcham(formData).subscribe({
          next: (response) => {
            this.showSuccess(this.texts.saveSuccess);
            this.loadAmchams();
            this.closeAddAmchamModal();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de l\'enregistrement:', error);
            this.showError(error.message || this.texts.error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  viewAmcham(amcham: CountryAmchamResponse): void {
    console.log('View amcham:', amcham);
  }

  editAmcham(amcham: CountryAmchamResponse): void {
    this.isEditMode = true;
    this.selectedAmchamId = amcham.id;
    this.showAddAmchamModal = true;
    
    this.amchamForm.patchValue({
      name: amcham.countryName,
      countryId: amcham.countryId,
      address: amcham.address,
      telephone: amcham.telephone,
      email: amcham.email,
      website: amcham.website
    });

    this.errorMessage = '';
  }

  deleteAmcham(amcham: CountryAmchamResponse): void {
    if (confirm(this.texts.confirmDelete)) {
      this.isLoading = true;
      
      this.countryAmchamService.deleteCountryAmcham(amcham.id).subscribe({
        next: () => {
          this.showSuccess(this.texts.deleteSuccess);
          this.loadAmchams();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.showError(error.message || this.texts.error);
          this.isLoading = false;
        }
      });
    }
  }

  getCountryFlagById(countryId: number): string {
      const country = this.countries.find(c => c.id === countryId);
      return country?.icon || '🌍';
    }

  getCountryNameById(countryId: number): string {
    const country = this.countries.find(c => c.id === countryId);
    return country?.name || 'N/A';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}