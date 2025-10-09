import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { CardStateComponent } from "../card-state/card-state.component";
import { LanguageService } from '../../../services/language.service';
import { CategoryService, CategoryResponse } from '../../../services/category.service';

// Import direct du service et des interfaces
import { AnnonceService, Annonce, AnnonceResponse, AnnoncePageResponse, SearchParams } from '../../../services/annonce.service';

@Component({
  selector: 'app-annonces',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './annonces.component.html',
  styleUrls: ['./annonces.component.css']
})
export class AnnoncesComponent implements OnInit, OnDestroy {
  showAddAnnouncementModal = false;
  showEditAnnouncementModal = false;
  announcementForm!: FormGroup;
  editingId: number | null = null;
  
  annonces: AnnonceResponse[] = [];
  filteredAnnonces: AnnonceResponse[] = [];
  categories: CategoryResponse[] = [];
  
  selectedCategoryId: number | null = null;
  searchTerm = '';
  currentRoute: string;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Preview de l'image
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  
  private langSubscription!: Subscription;
  currentLang = 'fr';
  document: any;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      announcementsManagement: 'Gestion des annonces',
      searchPlaceholder: 'Rechercher ici...',
      allCategories: 'Toutes les catégories',
      allStatuses: 'Tous les statuts',
      addAnnouncement: 'Ajouter une annonce',
      announcement: 'Annonce',
      category: 'Catégorie',
      status: 'Statut',
      date: 'Date',
      actions: 'Actions',
      newAnnouncement: 'Nouvelle Annonce',
      editAnnouncement: 'Modifier l\'Annonce',
      title: 'Titre',
      description: 'Description',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      address: 'Adresse',
      image: 'Image',
      chooseFile: 'Choisir un fichier',
      noFileChosen: 'Aucun fichier choisi',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      loading: 'Chargement...',
      noAnnouncementFound: 'Aucune annonce trouvée',
      tryDifferentSearch: 'Essayez de modifier vos critères de recherche ou de filtre.',
      errorOccurred: 'Une erreur est survenue',
      announcementAdded: 'Annonce ajoutée avec succès',
      announcementUpdated: 'Annonce modifiée avec succès',
      announcementDeleted: 'Annonce supprimée avec succès',
      selectCategory: 'Sélectionner'
    } : {
      announcementsManagement: 'Announcements Management',
      searchPlaceholder: 'Search here...',
      allCategories: 'All categories',
      allStatuses: 'All statuses',
      addAnnouncement: 'Add Announcement',
      announcement: 'Announcement',
      category: 'Category',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      newAnnouncement: 'New Announcement',
      editAnnouncement: 'Edit Announcement',
      title: 'Title',
      description: 'Description',
      startDate: 'Start Date',
      endDate: 'End Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      address: 'Address',
      image: 'Image',
      chooseFile: 'Choose a file',
      noFileChosen: 'No file chosen',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Are you sure you want to delete this announcement?',
      loading: 'Loading...',
      noAnnouncementFound: 'No announcements found',
      tryDifferentSearch: 'Try modifying your search or filter criteria.',
      errorOccurred: 'An error occurred',
      announcementAdded: 'Announcement added successfully',
      announcementUpdated: 'Announcement updated successfully',
      announcementDeleted: 'Announcement deleted successfully',
      selectCategory: 'Select'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private categoryService: CategoryService,
    private annonceService: AnnonceService // Injection directe du service
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
  }

  ngOnInit(): void {
    console.log('AnnonceService injecté:', this.annonceService); // Debug
    
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Chargement immédiat sans délai
    this.loadCategories();
    this.loadAnnonces();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      address: ['', [Validators.required]],
      categoryId: [null, [Validators.required]],
      imageFile: [null]
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Catégories chargées:', categories); // Debug
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
        this.error = 'Erreur lors du chargement des catégories';
      }
    });
  }

  private loadAnnonces(): void {
    this.loading = true;
    this.error = null;

    const searchParams: SearchParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.selectedCategoryId) {
      searchParams.categoryId = this.selectedCategoryId;
    }

    if (this.searchTerm.trim()) {
      searchParams.title = this.searchTerm.trim();
    }

    console.log('Paramètres de recherche:', searchParams); // Debug

    this.annonceService.getAnnonces(searchParams).subscribe({
      next: (response: AnnoncePageResponse) => {
        console.log('Réponse du service:', response); // Debug
        this.annonces = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.updateFilteredAnnonces();
        this.loading = false;
        
        console.log('Annonces chargées:', this.annonces.length); // Debug
      },
      error: (error: any) => {
        console.error('Erreur complète:', error); // Debug
        this.error = error.message || 'Erreur lors du chargement des annonces';
        this.loading = false;
        this.annonces = [];
        this.updateFilteredAnnonces();
      }
    });
  }

  private updateFilteredAnnonces(): void {
    this.filteredAnnonces = [...this.annonces];
    console.log('Annonces filtrées:', this.filteredAnnonces.length); // Debug
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.currentPage = 0;
    this.loadAnnonces();
  }

  onCategoryFilter(event: any): void {
    const value = event.target.value;
    this.selectedCategoryId = value === 'all' ? null : parseInt(value);
    this.currentPage = 0;
    this.loadAnnonces();
  }

  getCategoryDisplayName(category: { nameFr: string; nameEn: string }): string {
    return this.currentLang === 'fr' ? category.nameFr : category.nameEn;
  }

  getAnnonceImage(annonce: AnnonceResponse): string {
    if (!annonce.image) {
      return '/assets/images/default-event.jpg';
    }
    
    // Vérifier si l'image est déjà une URL complète
    if (annonce.image.startsWith('http')) {
      return annonce.image;
    }
    
    // Construire l'URL complète
    const imageUrl = `https://wakana.online/repertoire_amchams/${annonce.image}`;
    console.log('URL image:', imageUrl); // Debug
    return imageUrl;
  }

  openAddAnnouncementModal(): void {
    this.showAddAnnouncementModal = true;
    this.showEditAnnouncementModal = false;
    this.editingId = null;
    this.announcementForm.reset();
    this.imagePreview = null;
    this.selectedImageFile = null;
  }

  openEditAnnouncementModal(annonce: AnnonceResponse): void {
    this.showEditAnnouncementModal = true;
    this.showAddAnnouncementModal = false;
    this.editingId = annonce.id;
    
    // Convertir les dates du format "jj-mm-aaaa" vers "aaaa-mm-jj" pour l'input date
    const startDateFormatted = this.convertToInputDate(annonce.startDate);
    const endDateFormatted = this.convertToInputDate(annonce.endDate);

    this.announcementForm.patchValue({
      title: annonce.title,
      description: annonce.description,
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      startTime: annonce.startTime,
      endTime: annonce.endTime,
      address: annonce.address,
      categoryId: annonce.category.id
    });
    this.imagePreview = this.getAnnonceImage(annonce);
    this.selectedImageFile = null;
  }

  closeModals(): void {
    this.showAddAnnouncementModal = false;
    this.showEditAnnouncementModal = false;
    this.editingId = null;
    this.announcementForm.reset();
    this.imagePreview = null;
    this.selectedImageFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validation du type de fichier
      if (!file.type.startsWith('image/')) {
        this.error = 'Veuillez sélectionner un fichier image valide';
        return;
      }

      // Validation de la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'L\'image ne doit pas dépasser 5MB';
        return;
      }

      this.selectedImageFile = file;
      
      // Créer une preview de l'image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Convertit une date du format "aaaa-mm-jj" (input date) vers "jj-mm-aaaa"
   */
  private convertToDisplayDate(dateString: string): string {
    if (!dateString) return '';
    
    // Si la date est déjà au format "jj-mm-aaaa", on la retourne telle quelle
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString;
    }
    
    // Conversion depuis "aaaa-mm-jj" vers "jj-mm-aaaa"
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateString;
  }

  /**
   * Convertit une date du format "jj-mm-aaaa" vers "aaaa-mm-jj" (input date)
   */
  private convertToInputDate(dateString: string): string {
    if (!dateString) return '';
    
    // Si la date est déjà au format "aaaa-mm-jj", on la retourne telle quelle
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Conversion depuis "jj-mm-aaaa" vers "aaaa-mm-jj"
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateString;
  }

  onSubmit(): void {
    if (this.announcementForm.valid) {
      // Convertir les dates du format input ("aaaa-mm-jj") vers "jj-mm-aaaa"
      const startDateInput = this.announcementForm.get('startDate')?.value;
      const endDateInput = this.announcementForm.get('endDate')?.value;

      const annonceData: Annonce = {
        title: this.announcementForm.get('title')?.value.trim(),
        description: this.announcementForm.get('description')?.value.trim(),
        startDate: this.convertToDisplayDate(startDateInput),
        endDate: this.convertToDisplayDate(endDateInput),
        startTime: this.announcementForm.get('startTime')?.value,
        endTime: this.announcementForm.get('endTime')?.value,
        address: this.announcementForm.get('address')?.value.trim(),
        categoryId: parseInt(this.announcementForm.get('categoryId')?.value),
        imageFile: this.selectedImageFile || undefined
      };

      console.log('Données envoyées:', annonceData); // Debug

      if (this.editingId) {
        this.updateAnnonce(this.editingId, annonceData);
      } else {
        this.addAnnonce(annonceData);
      }
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched(this.announcementForm);
    }
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs de validation
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  private addAnnonce(annonceData: Annonce): void {
    this.loading = true;
    
    this.annonceService.saveAnnonce(annonceData).subscribe({
      next: (response: AnnonceResponse) => {
        this.closeModals();
        this.loadAnnonces();
        this.loading = false;
        console.log(this.texts.announcementAdded);
      },
      error: (error: any) => {
        this.error = error.message || 'Erreur lors de l\'ajout de l\'annonce';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private updateAnnonce(id: number, annonceData: Annonce): void {
    this.loading = true;
    
    this.annonceService.updateAnnonce(id, annonceData).subscribe({
      next: (response: AnnonceResponse) => {
        this.closeModals();
        this.loadAnnonces();
        this.loading = false;
        console.log(this.texts.announcementUpdated);
      },
      error: (error: any) => {
        this.error = error.message || 'Erreur lors de la modification de l\'annonce';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  viewAnnouncement(annonce: AnnonceResponse): void {
    console.log('View announcement:', annonce);
    // Implémenter la vue détaillée
  }

  editAnnouncement(annonce: AnnonceResponse): void {
    this.openEditAnnouncementModal(annonce);
  }

  deleteAnnouncement(annonce: AnnonceResponse): void {
    if (confirm(this.texts.confirmDelete)) {
      this.loading = true;
      
      this.annonceService.deleteAnnonce(annonce.id).subscribe({
        next: () => {
          this.loadAnnonces();
          this.loading = false;
          console.log(this.texts.announcementDeleted);
        },
        error: (error: any) => {
          this.error = error.message || 'Erreur lors de la suppression de l\'annonce';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  clearError(): void {
    this.error = null;
  }

  // Méthode pour formater l'affichage des dates dans le tableau
  formatDisplayDate(dateString: string): string {
    return this.convertToDisplayDate(dateString);
  }
}