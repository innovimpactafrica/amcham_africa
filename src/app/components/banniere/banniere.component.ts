import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { LanguageService } from '../../../services/language.service';
import { BanniereService, Banniere, BanniereFormData } from '../../../services/banniere.service';
import { Subscription } from 'rxjs';
import { CardStateComponent } from "../card-state/card-state.component";

@Component({
  selector: 'app-banniere',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './banniere.component.html',
  styleUrls: ['./banniere.component.css']
})
export class BanniereComponent implements OnInit, OnDestroy {
  showAddBanniereModal = false;
  banniereForm!: FormGroup;
  bannieres: Banniere[] = [];
  filteredBannieres: Banniere[] = [];
  selectedStatus = 'all';
  searchTerm = '';
  editingBanniereId: number | null = null;
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  loading = false;
  error = '';

  selectedEditMobileImage: File | null = null;
  editingBanniereMobileImageName: string = '';
  selectedEditWebImage: File | null = null;
  editingBanniereWebImageName: string = '';
  editingBanniere: Banniere | null = null;

  // Fichiers sélectionnés pour l'upload
  selectedWebImage: File | null = null;
  selectedMobileImage: File | null = null;

  // Statistiques calculées
  get stats() {
    const totalBannieres = this.bannieres.length;
    const activeBannieres = this.bannieres.filter(b => this.isBanniereActive(b)).length;
    
    const searches = 1243;
    const lastWeekSearches = Math.floor(searches * 0.05);
    
    const adClicks = 348;
    const lastMonthClicks = Math.floor(adClicks * 0.18);

    return {
      totalBannieres,
      activeBannieres,
      banniereGrowth: totalBannieres > 0 ? Math.round((activeBannieres / totalBannieres) * 100) : 0,
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
      bannerManagement: 'Gestion des bannières publicitaires',
      totalBanners: 'Bannières totales',
      activeBanners: 'Bannières actives',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      searchPlaceholder: 'Rechercher ici...',
      allStatuses: 'Tous les statuts',
      addBanner: 'Ajouter une bannière',
      title: 'Titre',
      description: 'Description',
      link: 'Lien',
      create:'Enregistrer',
      status: 'Statut',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      permanent: 'Permanent',
      actions: 'Actions',
      active: 'Actif',
      expired: 'Expiré',
      pending: 'En attente',
      newBanner: 'Nouvelle bannière publicitaire',
      bannerTitle: 'Titre',
      bannerDescription: 'Description',
      websiteLink: 'Lien vers un site web',
      startDateRequired: 'Date de début',
      endDateRequired: 'Date de fin',
      webImage: 'Image (WEB)',
      mobileImage: 'Image (Mobile)',
      chooseFile: 'Choisir un fichier',
      noFileChosen: 'Aucun fichier choisi',
      save: 'Enregistrer',
      cancel: 'Annuler',
      enter: 'Saisir',
      writeDescription: 'Écrivez une description',
      exampleTitle: 'Ex: Opportunités d\'investissement',
      exampleLink: 'Ex: https://example.com',
      dateFormat: 'jj/mm/aaaa',
      view: 'Voir',
      edit: 'Modifier',
      delete: 'Supprimer',
      partnership: 'Partenariat',
      investmentSelection: 'Sélectionnées d\'investissement',
      annualConference: 'Conférence annuelle AmCham',
      partnershipProgram: 'Programme de partenariat',
      loading: 'Chargement des bannières...',
      error: 'Erreur lors du chargement des bannières',
      yes: 'Oui',
      no: 'Non'
    } : {
      bannerManagement: 'Banner Management',
      totalBanners: 'Total Banners',
      activeBanners: 'Active Banners',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      searchPlaceholder: 'Search here...',
      allStatuses: 'All statuses',
      addBanner: 'Add Banner',
      title: 'Title',
      description: 'Description',
      link: 'Link',
      status: 'Status',
      startDate: 'Start Date',
      endDate: 'End Date',
      permanent: 'Permanent',
      actions: 'Actions',
      active: 'Active',
      create:'Saved', 
      expired: 'Expired',
      pending: 'Pending',
      newBanner: 'New Banner',
      bannerTitle: 'Title',
      bannerDescription: 'Description',
      websiteLink: 'Website Link',
      startDateRequired: 'Start Date',
      endDateRequired: 'End Date',
      webImage: 'Image (WEB)',
      mobileImage: 'Image (Mobile)',
      chooseFile: 'Choose File',
      noFileChosen: 'No file chosen',
      save: 'Save',
      cancel: 'Cancel',
      enter: 'Enter',
      writeDescription: 'Write a description',
      exampleTitle: 'Ex: Investment Opportunities',
      exampleLink: 'Ex: https://example.com',
      dateFormat: 'dd/mm/yyyy',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      partnership: 'Partnership',
      investmentSelection: 'Investment Selection',
      annualConference: 'Annual AmCham Conference',
      partnershipProgram: 'Partnership Program',
      loading: 'Loading banners...',
      error: 'Error loading banners',
      yes: 'Yes',
      no: 'No'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private banniereService: BanniereService
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    this.loadBannieres();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger les bannières depuis l'API
   */
  public loadBannieres(): void {
    this.loading = true;
    this.error = '';

    this.banniereService.getBannieres().subscribe({
      next: (response) => {
        this.bannieres = response.content;
        this.filteredBannieres = [...this.bannieres];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des bannières:', error);
        this.error = this.texts.error;
        this.loading = false;
      }
    });
  }

  private initializeForm(): void {
    this.banniereForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      link: ['', [Validators.required]],
      permanent: [false],
      startDate: ['', [Validators.required]],
      endDate: ['']
    });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterBannieres();
  }

  onStatusFilter(event: any): void {
    this.selectedStatus = event.target.value;
    this.filterBannieres();
  }

  private filterBannieres(): void {
    this.filteredBannieres = this.bannieres.filter(banniere => {
      const matchesSearch = banniere.title.toLowerCase().includes(this.searchTerm) ||
                          banniere.description.toLowerCase().includes(this.searchTerm) ||
                          banniere.link.toLowerCase().includes(this.searchTerm);
      
      const matchesStatus = this.selectedStatus === 'all' || this.getBanniereStatus(banniere) === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  /**
   * Déterminer le statut d'une bannière
   */
  public getBanniereStatus(banniere: Banniere): string {
    if (banniere.permanent) {
      return this.currentLang === 'fr' ? 'Actif' : 'Active';
    }

    const today = new Date();
    const startDate = this.parseDate(banniere.startDate);
    const endDate = this.parseDate(banniere.endDate);

    if (today < startDate) {
      return this.currentLang === 'fr' ? 'En attente' : 'Pending';
    } else if (today > endDate) {
      return this.currentLang === 'fr' ? 'Expiré' : 'Expired';
    } else {
      return this.currentLang === 'fr' ? 'Actif' : 'Active';
    }
  }

  /**
   * Vérifier si une bannière est active
   */
  private isBanniereActive(banniere: Banniere): boolean {
    return this.getBanniereStatus(banniere) === (this.currentLang === 'fr' ? 'Actif' : 'Active');
  }

  /**
   * Parser une date au format dd-MM-yyyy
   */
  private parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  showEditBanniereModal = false;

  onEditWebImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedWebImage = file;
      console.log('Web image selected:', file.name);
    }
  }
  /**
   * Formater une date pour l'affichage
   */
  public formatDateForDisplay(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }


  /**
   * Obtenir l'affichage pour le champ permanent
   */
  getPermanentDisplay(permanent: boolean): string {
    return permanent ? this.texts.yes : this.texts.no;
  }
  

  onEditMobileImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedMobileImage = file;
      console.log('Mobile image selected:', file.name);
    }
  } 

  onWebImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedWebImage = file;
      console.log('Web image selected:', file.name);
    }
  }

  onMobileImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedMobileImage = file;
      console.log('Mobile image selected:', file.name);
    }
  }
  onSubmit(): void {
    if (this.banniereForm.valid) {
      const startDate = this.banniereForm.get('startDate')?.value;
      const endDate = this.banniereForm.get('endDate')?.value;
      
      const formData: BanniereFormData = {
        title: this.banniereForm.get('title')?.value,
        description: this.banniereForm.get('description')?.value,
        link: this.banniereForm.get('link')?.value,
        permanent: this.banniereForm.get('permanent')?.value,
        startDate: this.convertDateForAPI(startDate),
        endDate: endDate ? this.convertDateForAPI(endDate) : '',
        webImg: this.selectedWebImage || undefined,
        mobileImg: this.selectedMobileImage || undefined
      };
  
      this.loading = true;
  
      // Si on est en mode édition
      if (this.editingBanniere) {
        this.banniereService.updateBanniere(this.editingBanniere.id, formData).subscribe({
          next: () => {
            this.loadBannieres();
            this.closeEditBanniereModal();
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la modification de la bannière:', error);
            this.loading = false;
          }
        });
      } else {
        // Mode création (code existant)
        this.banniereService.createBanniere(formData).subscribe({
          next: () => {
            this.loadBannieres();
            this.closeAddBanniereModal();
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la création de la bannière:', error);
            this.loading = false;
          }
        });
      }
    }
  }
  
  // Ajoutez cette méthode pour obtenir le titre du modal
  get modalTitle(): string {
    return this.editingBanniere 
      ? (this.currentLang === 'fr' ? 'Modifier la bannière' : 'Edit Banner')
      : this.texts.newBanner;
  }
  closeAddBanniereModal(): void {
    this.showAddBanniereModal = false;
    this.editingBanniereId = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Actif':
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expiré':
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'En attente':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewBanniere(banniere: Banniere): void {
    console.log('View banniere:', banniere);
    // Ouvrir le lien dans un nouvel onglet
    if (banniere.link) {
      window.open(banniere.link, '_blank');
    }
  }
  convertToDateInputFormat = (dateString: string): string => {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  closeEditBanniereModal(): void {
    this.showEditBanniereModal = false;
    this.editingBanniere = null;
    this.banniereForm.reset({ permanent: false });
    this.selectedWebImage = null;
    this.selectedMobileImage = null;
  }
  private convertDateForAPI(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  get submitButtonText(): string {
    if (this.loading) {
      return this.currentLang === 'fr' ? 'Enregistrement...' : 'Saving...';
    }
    return this.editingBanniere 
      ? (this.currentLang === 'fr' ? 'Mettre à jour' : 'Update')
      : this.texts.save;
  }
  // Méthode pour convertir la date du format dd-MM-yyyy vers yyyy-MM-dd (pour l'input type="date")
  private convertDateForInput(dateString: string): string {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  editBanniere(banniere: Banniere): void {
    this.editingBanniere = banniere;
    this.showEditBanniereModal = true;
    
    
    // Pré-remplir le formulaire avec les données existantes
    this.banniereForm.patchValue({
      title: banniere.title,
      description: banniere.description,
      link: banniere.link,
      permanent: banniere.permanent,
      startDate: this.convertDateForInput(banniere.startDate),
      endDate: banniere.permanent ? '' : this.convertDateForInput(banniere.endDate)
    });
    
    // Réinitialiser les fichiers sélectionnés
    this.selectedWebImage = null;
    this.selectedMobileImage = null;
  }
  openAddBanniereModal(): void {
    this.editingBanniereId = null;
    this.showAddBanniereModal = true;
    this.banniereForm.reset({ permanent: false });
    this.selectedWebImage = null;
    this.selectedMobileImage = null;
  }

  deleteBanniere(banniere: Banniere): void {
    if (confirm(this.currentLang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette bannière ?' : 'Are you sure you want to delete this banner?')) {
      this.loading = true;
      this.banniereService.deleteBanniere(banniere.id).subscribe({
        next: () => {
          this.loadBannieres();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la bannière:', error);
          this.loading = false;
        }
      });
    }
  }

  onPermanentChange(): void {
    const permanent = this.banniereForm.get('permanent')?.value;
    if (permanent) {
      this.banniereForm.get('endDate')?.clearValidators();
    } else {
      this.banniereForm.get('endDate')?.setValidators([Validators.required]);
    }
    this.banniereForm.get('endDate')?.updateValueAndValidity();
  }

  /**
   * Obtenir l'URL complète de l'image
   */
  getImageUrl(imagePath: string): string {
    return this.banniereService.getImageUrl(imagePath);
  }
}