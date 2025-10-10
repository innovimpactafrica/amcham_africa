import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { LanguageService } from '../../../services/language.service';
import { Subscription } from 'rxjs';
import { CardStateComponent } from "../card-state/card-state.component";
import { Company, CompanyFormData, CompanyService } from '../../../services/company.service';

interface Membre {
  id: number;
  nom: string;
  secteur: string;
  pictures:string[];
  pays: string;
  statut: 'Actif' | 'Inactif' | 'En attente' | 'Active' | 'Inactive' | 'Pending';
  date: string;
  logo?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

@Component({
  selector: 'app-membres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './membres.component.html',
  styleUrls: ['./membres.component.css']
})
export class MembresComponent implements OnInit, OnDestroy {
  showAddMemberModal = false;
  memberForm!: FormGroup;
  membres: Membre[] = [];
  filteredMembres: Membre[] = [];
  selectedStatus = 'all';
  searchTerm = '';
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  isLoading = false;
  error: string | null = null;
  
  // ID du pays AMCHAM (à adapter selon votre configuration)
  countryAmchamId = 1;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
Math: any;

  // Statistiques calculées
  get stats() {
    const totalMembers = this.totalElements;
    const lastMonthMembers = this.membres.filter(m => {
      const memberDate = this.parseDate(m.date);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return memberDate > lastMonth;
    }).length;

    const searches = 1243;
    const lastWeekSearches = Math.floor(searches * 0.05);

    const adClicks = 348;
    const lastMonthClicks = Math.floor(adClicks * 0.18);

    return {
      totalMembers,
      lastMonthMembers,
      memberGrowth: totalMembers > 0 ? Math.round((lastMonthMembers / totalMembers) * 100) : 0,
      searches,
      lastWeekSearches,
      searchGrowth: 5,
      adClicks,
      lastMonthClicks,
      clickGrowth: 18
    };
  }

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      membersManagement: 'Gestion des membres',
      totalMembers: 'Membres totaux',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      searchPlaceholder: 'Rechercher ici...',
      allStatuses: 'Tous les status',
      addMember: 'Ajouter un membre',
      name: 'Nom',
      country: 'Pays',
      status: 'Statut',
      date: 'Date',
      actions: 'Actions',
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
      newMember: 'Nouveau Membre',
      companyName: 'Nom de l\'entreprise',
      companyAddress: 'Adresse de l\'entreprise',
      companyPhone: 'Téléphone de l\'entreprise',
      companyEmail: 'Email de l\'entreprise',
      activitySector: 'Secteur d\'activité',
      website: 'Site Web',
      logo: 'Logo',
      chooseFile: 'Choisir un fichier',
      noFileChosen: 'Aucun fichier choisi',
      save: 'Enregistrer',
      cancel: 'Annuler',
      enter: 'Saisir',
      select: 'Sélectionner',
      technology: 'Technologie',
      finance: 'Finance',
      health: 'Santé',
      education: 'Éducation',
      loading: 'Chargement...',
      errorLoading: 'Erreur lors du chargement',
      successAdd: 'Membre ajouté avec succès',
      errorAdd: 'Erreur lors de l\'ajout du membre',
      latitude: 'Latitude',
      longitude: 'Longitude',
      videoLink: 'Lien vidéo'
    } : {
      membersManagement: 'Members Management',
      totalMembers: 'Total Members',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      searchPlaceholder: 'Search here...',
      allStatuses: 'All statuses',
      addMember: 'Add Member',
      name: 'Name',
      country: 'Country',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      newMember: 'New Member',
      companyName: 'Company Name',
      companyAddress: 'Company Address',
      companyPhone: 'Company Phone',
      companyEmail: 'Company Email',
      activitySector: 'Activity Sector',
      website: 'Website',
      logo: 'Logo',
      chooseFile: 'Choose File',
      noFileChosen: 'No file chosen',
      save: 'Save',
      cancel: 'Cancel',
      enter: 'Enter',
      select: 'Select',
      technology: 'Technology',
      finance: 'Finance',
      health: 'Health',
      education: 'Education',
      loading: 'Loading...',
      errorLoading: 'Error loading',
      successAdd: 'Member added successfully',
      errorAdd: 'Error adding member',
      latitude: 'Latitude',
      longitude: 'Longitude',
      videoLink: 'Video Link'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private companyService: CompanyService
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updateMembresLanguage();
    });

    this.currentLang = this.languageService.getCurrentLanguage();
    this.loadMembres();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.memberForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      address: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      webLink: [''],
      countryAmchamId: [this.countryAmchamId, [Validators.required]],
      sectorId: ['', [Validators.required]],
      videoLink: [''],
      lat: [0],
      lon: [0],
      logoFile: [null]
    });
  }

  /**
   * Charger les membres depuis l'API
   */
  loadMembres(): void {
    this.isLoading = true;
    this.error = null;

    this.companyService.getMembres(this.countryAmchamId, {
      page: this.currentPage,
      size: this.pageSize,
      name: this.searchTerm || undefined,
      sector: this.selectedStatus !== 'all' ? this.selectedStatus : undefined
    }).subscribe({
      next: (response) => {
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        
        // Convertir les données API en format Membre
        this.membres = response.content.map(company => this.mapCompanyToMembre(company));
        this.filteredMembres = [...this.membres];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.error = error.message || this.texts.errorLoading;
        this.isLoading = false;
      }
    });
  }

  /**
   * Convertir Company en Membre
   */
  private mapCompanyToMembre(company: Company): Membre {
    return {
      id: company.id,
      pictures:company.pictures,
      nom: company.name,
      secteur: company.sector,
      pays: company.country || company.countryAmcham,
      statut: 'Actif', // À adapter selon votre logique
      date: this.formatDateForDisplay(new Date()),
      logo: company.logo,
      adresse: company.address,
      telephone: company.telephone,
      email: company.email,
      siteWeb: company.webLink
    };
  }

  /**
   * Formater la date au format jj-mm-aaaa
   */
  private formatDateForDisplay(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Parser une date au format jj-mm-aaaa
   */
  private parseDate(dateString: string): Date {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  }

  private updateMembresLanguage(): void {
    this.membres = this.membres.map(membre => ({
      ...membre,
      secteur: this.translateSector(membre.secteur),
      pays: this.translateCountry(membre.pays),
      statut: this.translateStatus(membre.statut)
    }));
    this.filterMembers();
  }

  private translateSector(sector: string): string {
    const sectorMap = this.currentLang === 'fr' ? {
      'Technology': 'Technologie',
      'Finance': 'Finance',
      'Health': 'Santé',
      'Education': 'Éducation'
    } : {
      'Technologie': 'Technology',
      'Finance': 'Finance',
      'Santé': 'Health',
      'Éducation': 'Education'
    };
    return sectorMap[sector as keyof typeof sectorMap] || sector;
  }

  private translateCountry(country: string): string {
    const countryMap = this.currentLang === 'fr' ? {
      'United States': 'États-Unis',
      'France': 'France',
      'Canada': 'Canada',
      'United Kingdom': 'Royaume-Uni'
    } : {
      'États-Unis': 'United States',
      'France': 'France',
      'Canada': 'Canada',
      'Royaume-Uni': 'United Kingdom'
    };
    return countryMap[country as keyof typeof countryMap] || country;
  }

  private translateStatus(status: string): any {
    const statusMap = this.currentLang === 'fr' ? {
      'Active': 'Actif',
      'Inactive': 'Inactif',
      'Pending': 'En attente'
    } : {
      'Actif': 'Active',
      'Inactif': 'Inactive',
      'En attente': 'Pending'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 0;
    this.loadMembres();
  }

  onStatusFilter(event: any): void {
    this.selectedStatus = event.target.value;
    this.currentPage = 0;
    this.loadMembres();
  }

  private filterMembers(): void {
    this.filteredMembres = [...this.membres];
  }

  openAddMemberModal(): void {
    this.showAddMemberModal = true;
    this.memberForm.reset({
      countryAmchamId: this.countryAmchamId,
      lat: 0,
      lon: 0
    });
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  selectedFileName: string = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.memberForm.patchValue({
        logoFile: file
      });
    }
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      this.isLoading = true;
      this.error = null;

      const formData: CompanyFormData = {
        name: this.memberForm.get('name')?.value,
        description: this.memberForm.get('description')?.value,
        address: this.memberForm.get('address')?.value,
        email: this.memberForm.get('email')?.value,
        telephone: this.memberForm.get('telephone')?.value,
        webLink: this.memberForm.get('webLink')?.value || '',
        countryAmchamId: this.memberForm.get('countryAmchamId')?.value,
        sectorId: this.memberForm.get('sectorId')?.value,
        videoLink: this.memberForm.get('videoLink')?.value || '',
        lat: this.memberForm.get('lat')?.value || 0,
        lon: this.memberForm.get('lon')?.value || 0,
        logoFile: this.memberForm.get('logoFile')?.value,
        country: ''
      };

      this.companyService.saveCompany(formData).subscribe({
        next: (response) => {
          console.log(this.texts.successAdd, response);
          this.closeAddMemberModal();
          this.loadMembres(); // Recharger la liste
          this.isLoading = false;
        },
        error: (error) => {
          console.error(this.texts.errorAdd, error);
          this.error = error.message || this.texts.errorAdd;
          this.isLoading = false;
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Actif':
      case 'Active':
        return 'text-green-600';
      case 'Inactif':
      case 'Inactive':
        return 'text-red-600';
      case 'En attente':
      case 'Pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  viewMember(membre: Membre): void {
    // Navigation vers la page de détail
    this.router.navigate(['/admin/membres', membre.id]);
  }

  editMember(membre: Membre): void {
    // Navigation vers la page d'édition
    this.router.navigate(['/admin/membres', membre.id, 'edit']);
  }

  toggleMemberStatus(membre: Membre): void {
    if (membre.statut === 'Actif' || membre.statut === 'Active') {
      membre.statut = this.currentLang === 'fr' ? 'Inactif' : 'Inactive';
    } else {
      membre.statut = this.currentLang === 'fr' ? 'Actif' : 'Active';
    }
    // TODO: Appeler l'API pour mettre à jour le statut
  }

  getSectorInitial(secteur: string): string {
    return secteur.charAt(0).toUpperCase();
  }
}