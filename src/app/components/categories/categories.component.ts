import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { CardStateComponent } from "../card-state/card-state.component";
import { LanguageService } from '../../../services/language.service';

// Import des interfaces seulement pour éviter les dépendances circulaires
import type { Category, CategoryResponse } from '../../../services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  showAddCategorieModal = false;
  showEditCategorieModal = false;
  categorieForm!: FormGroup;
  editingId: number | null = null;
  
  categories: CategoryResponse[] = [];
  filteredCategories: CategoryResponse[] = [];
  searchTerm = '';
  currentRoute: string;
  loading = false;
  error: string | null = null;
  
  private langSubscription!: Subscription;
  currentLang = 'fr';

  // Statistiques
  totalCategoriesCount = 0;

  // Injection du service dans le constructor
  private categoryService: any;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      categoriesManagement: 'Gestion des catégories',
      totalCategories: 'Catégories totales',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      searchPlaceholder: 'Rechercher ici...',
      addCategory: 'Ajouter une catégorie',
      category: 'Catégorie',
      name: 'Nom',
      nameEn: 'Nom (English)',
      nameFr: 'Nom (Français)',
      actions: 'Actions',
      newCategory: 'Nouvelle Catégorie',
      editCategory: 'Modifier la Catégorie',
      categoryNameFr: 'Nom de la catégorie (Français)',
      categoryNameEn: 'Nom de la catégorie (Anglais)',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
      loading: 'Chargement...',
      noCategoryFound: 'Aucune catégorie trouvée',
      tryDifferentSearch: 'Essayez de modifier vos critères de recherche.',
      errorOccurred: 'Une erreur est survenue',
      categoryAdded: 'Catégorie ajoutée avec succès',
      categoryUpdated: 'Catégorie modifiée avec succès',
      categoryDeleted: 'Catégorie supprimée avec succès'
    } : {
      categoriesManagement: 'Categories Management',
      totalCategories: 'Total Categories',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      searchPlaceholder: 'Search here...',
      addCategory: 'Add Category',
      category: 'Category',
      name: 'Name',
      nameEn: 'Name (English)',
      nameFr: 'Name (Français)',
      actions: 'Actions',
      newCategory: 'New Category',
      editCategory: 'Edit Category',
      categoryNameFr: 'Category Name (French)',
      categoryNameEn: 'Category Name (English)',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this category?',
      loading: 'Loading...',
      noCategoryFound: 'No categories found',
      tryDifferentSearch: 'Try modifying your search criteria.',
      errorOccurred: 'An error occurred',
      categoryAdded: 'Category added successfully',
      categoryUpdated: 'Category updated successfully',
      categoryDeleted: 'Category deleted successfully'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
    
    // Import dynamique du service pour éviter la dépendance circulaire
    this.initCategoryService();
  }

  private async initCategoryService() {
    try {
      const { CategoryService } = await import('../../../services/category.service');
      console.log('CategoryService importé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import du service:', error);
    }
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updateFilteredCategories();
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données avec un délai pour permettre l'initialisation du service
    setTimeout(() => {
      this.loadCategories();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.categorieForm = this.fb.group({
      nameFr: ['', [Validators.required]],
      nameEn: ['', [Validators.required]]
    });
  }

  private loadCategories(): void {
    // Données mock en attendant que le service soit correctement configuré
    const mockCategories: CategoryResponse[] = [
      { id: 1, nameFr: 'Événement', nameEn: 'Event' },
      { id: 2, nameFr: 'Actualité', nameEn: 'News' },
      { id: 3, nameFr: 'Opportunité', nameEn: 'Opportunity' },
      { id: 4, nameFr: 'Formation', nameEn: 'Training' },
      { id: 5, nameFr: 'Networking', nameEn: 'Networking' }
    ];

    this.loading = true;
    
    // Simuler un délai de chargement
    setTimeout(() => {
      this.categories = mockCategories;
      this.totalCategoriesCount = mockCategories.length;
      this.updateFilteredCategories();
      this.loading = false;
    }, 500);

    /* 
    // Code pour utiliser le vrai service (une fois HttpClient configuré)
    if (this.categoryService) {
      this.loading = true;
      this.error = null;

      this.categoryService.getCategories().subscribe({
        next: (response: CategoryResponse[]) => {
          this.categories = response;
          this.totalCategoriesCount = response.length;
          this.updateFilteredCategories();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = error.message || 'Erreur lors du chargement des catégories';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
    }
    */
  }

  private updateFilteredCategories(): void {
    if (this.searchTerm.trim()) {
      this.filteredCategories = this.categories.filter(category => {
        const displayName = this.getCategoryDisplayName(category).toLowerCase();
        const nameFr = category.nameFr.toLowerCase();
        const nameEn = category.nameEn.toLowerCase();
        const search = this.searchTerm.toLowerCase();
        
        return displayName.includes(search) || 
               nameFr.includes(search) || 
               nameEn.includes(search);
      });
    } else {
      this.filteredCategories = [...this.categories];
    }
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.updateFilteredCategories();
  }

  getCategoryDisplayName(category: CategoryResponse): string {
    return this.currentLang === 'fr' ? category.nameFr : category.nameEn;
  }

  openAddCategorieModal(): void {
    this.showAddCategorieModal = true;
    this.showEditCategorieModal = false;
    this.editingId = null;
    this.categorieForm.reset();
  }

  openEditCategorieModal(category: CategoryResponse): void {
    this.showEditCategorieModal = true;
    this.showAddCategorieModal = false;
    this.editingId = category.id;
    this.categorieForm.patchValue({
      nameFr: category.nameFr,
      nameEn: category.nameEn
    });
  }

  closeModals(): void {
    this.showAddCategorieModal = false;
    this.showEditCategorieModal = false;
    this.editingId = null;
    this.categorieForm.reset();
  }

  // Méthodes de compatibilité avec l'ancien code
  closeAddCategorieModal(): void {
    this.closeModals();
  }

  onSubmit(): void {
    if (this.categorieForm.valid) {
      const categoryData: Category = {
        nameFr: this.categorieForm.get('nameFr')?.value.trim(),
        nameEn: this.categorieForm.get('nameEn')?.value.trim()
      };

      if (this.editingId) {
        this.updateCategory(this.editingId, categoryData);
      } else {
        this.addCategory(categoryData);
      }
    }
  }

  private addCategory(categoryData: Category): void {
    this.loading = true;
    
    // Mock implementation
    setTimeout(() => {
      const newCategory: CategoryResponse = {
        id: Math.max(...this.categories.map(c => c.id)) + 1,
        nameFr: categoryData.nameFr,
        nameEn: categoryData.nameEn
      };
      
      this.categories.push(newCategory);
      this.totalCategoriesCount++;
      this.updateFilteredCategories();
      this.closeModals();
      this.loading = false;
      console.log(this.texts.categoryAdded);
    }, 500);
    
    /*
    // Code pour utiliser le vrai service
    if (this.categoryService) {
      this.categoryService.saveCategorie(categoryData).subscribe({
        next: (response: CategoryResponse) => {
          this.closeModals();
          this.loadCategories();
          this.loading = false;
          console.log(this.texts.categoryAdded);
        },
        error: (error: any) => {
          this.error = error.message || 'Erreur lors de l\'ajout de la catégorie';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
    }
    */
  }

  private updateCategory(id: number, categoryData: Category): void {
    this.loading = true;
    
    // Mock implementation
    setTimeout(() => {
      const index = this.categories.findIndex(c => c.id === id);
      if (index > -1) {
        this.categories[index] = { ...this.categories[index], ...categoryData };
        this.updateFilteredCategories();
      }
      this.closeModals();
      this.loading = false;
      console.log(this.texts.categoryUpdated);
    }, 500);
    
    /*
    // Code pour utiliser le vrai service
    if (this.categoryService) {
      this.categoryService.updateCategorie(id, categoryData).subscribe({
        next: (response: CategoryResponse) => {
          this.closeModals();
          this.loadCategories();
          this.loading = false;
          console.log(this.texts.categoryUpdated);
        },
        error: (error: any) => {
          this.error = error.message || 'Erreur lors de la modification de la catégorie';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
    }
    */
  }

  editCategory(category: CategoryResponse): void {
    this.openEditCategorieModal(category);
  }

  deleteCategory(category: CategoryResponse): void {
    if (confirm(this.texts.confirmDelete)) {
      this.loading = true;
      
      // Mock implementation
      setTimeout(() => {
        const index = this.categories.findIndex(c => c.id === category.id);
        if (index > -1) {
          this.categories.splice(index, 1);
          this.totalCategoriesCount--;
          this.updateFilteredCategories();
        }
        this.loading = false;
        console.log(this.texts.categoryDeleted);
      }, 500);
      
      /*
      // Code pour utiliser le vrai service
      if (this.categoryService) {
        this.categoryService.deleteCategorie(category.id).subscribe({
          next: () => {
            this.loadCategories();
            this.loading = false;
            console.log(this.texts.categoryDeleted);
          },
          error: (error: any) => {
            this.error = error.message || 'Erreur lors de la suppression de la catégorie';
            this.loading = false;
            console.error('Erreur:', error);
          }
        });
      }
      */
    }
  }

  // Utilitaire pour effacer les erreurs
  clearError(): void {
    this.error = null;
  }

  // Statistiques calculées (pour compatibilité avec l'ancien code)
  get stats() {
    const totalCategories = this.totalCategoriesCount;
    const lastMonthCategories = 0; // À calculer avec de vraies dates si nécessaire
    
    const searches = 1243;
    const lastWeekSearches = Math.floor(searches * 0.05);
    
    const adClicks = 348;
    const lastMonthClicks = Math.floor(adClicks * 0.18);

    return {
      totalCategories,
      lastMonthCategories,
      categoryGrowth: totalCategories > 0 ? Math.round((lastMonthCategories / totalCategories) * 100) : 0,
      searches,
      lastWeekSearches,
      searchGrowth: 5,
      adClicks,
      lastMonthClicks,
      clickGrowth: 18
    };
  }
}