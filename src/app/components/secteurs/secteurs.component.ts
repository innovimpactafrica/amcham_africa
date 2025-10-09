import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from "../header-admin/header-admin.component";
import { LanguageService } from '../../../services/language.service';
import { SecteurService, Secteur, SecteurResponse, SearchParams } from '../../../services/secteur.service';
import { Subscription } from 'rxjs';
import { CardStateComponent } from "../card-state/card-state.component";

@Component({
  selector: 'app-secteurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderAdminComponent, CardStateComponent],
  templateUrl: './secteurs.component.html',
  styleUrls: ['./secteurs.component.css']
})
export class SecteursComponent implements OnInit, OnDestroy {
  showAddSecteurModal = false;
  showEditSecteurModal = false;
  secteurForm!: FormGroup;
  editingId: number | null = null;
  
  secteurs: SecteurResponse[] = [];
  filteredSecteurs: SecteurResponse[] = [];
  searchTerm = '';
  currentRoute: string;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  private langSubscription!: Subscription;
  currentLang = 'fr';

  // Statistiques
  totalSecteursCount = 0;
Math: any;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      secteursManagement: 'Gestion des secteurs d\'activités',
      totalSecteurs: 'Secteurs totaux',
      sinceLastMonth: 'depuis le mois dernier',
      searches: 'Recherches',
      sinceLastWeek: 'depuis la semaine dernière',
      adClicks: 'Clics sur publicités',
      searchPlaceholder: 'Rechercher ici...',
      addSecteur: 'Ajouter un secteur',
      name: 'Nom',
      nameEn: 'Nom (English)',
      nameFr: 'Nom (Français)',
      actions: 'Actions',
      newSecteur: 'Nouveau Secteur',
      editSecteur: 'Modifier le Secteur',
      secteurNameFr: 'Nom du secteur (Français)',
      secteurNameEn: 'Nom du secteur (Anglais)',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce secteur ?',
      loading: 'Chargement...',
      noSecteurFound: 'Aucun secteur trouvé',
      tryDifferentSearch: 'Essayez de modifier vos critères de recherche.',
      errorOccurred: 'Une erreur est survenue',
      secteurAdded: 'Secteur ajouté avec succès',
      secteurUpdated: 'Secteur modifié avec succès',
      secteurDeleted: 'Secteur supprimé avec succès'
    } : {
      secteursManagement: 'Activity Sectors Management',
      totalSecteurs: 'Total Sectors',
      sinceLastMonth: 'since last month',
      searches: 'Searches',
      sinceLastWeek: 'since last week',
      adClicks: 'Ad Clicks',
      searchPlaceholder: 'Search here...',
      addSecteur: 'Add Sector',
      name: 'Name',
      nameEn: 'Name (English)',
      nameFr: 'Name (Français)',
      actions: 'Actions',
      newSecteur: 'New Sector',
      editSecteur: 'Edit Sector',
      secteurNameFr: 'Sector Name (French)',
      secteurNameEn: 'Sector Name (English)',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this sector?',
      loading: 'Loading...',
      noSecteurFound: 'No sectors found',
      tryDifferentSearch: 'Try modifying your search criteria.',
      errorOccurred: 'An error occurred',
      secteurAdded: 'Sector added successfully',
      secteurUpdated: 'Sector updated successfully',
      secteurDeleted: 'Sector deleted successfully'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService,
    private secteurService: SecteurService
  ) {
    this.currentRoute = this.router.url;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updateFilteredSecteurs();
    });
    
    this.currentLang = this.languageService.getCurrentLanguage();
    this.loadSecteurs();
    this.loadSecteursKpi();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.secteurForm = this.fb.group({
      nameFr: ['', [Validators.required]],
      nameEn: ['', [Validators.required]]
    });
  }

  private loadSecteurs(): void {
    this.loading = true;
    this.error = null;

    const searchParams: SearchParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.searchTerm.trim()) {
      // Recherche dans les deux langues selon la langue courante
      if (this.currentLang === 'fr') {
        searchParams.nameFr = this.searchTerm.trim();
      } else {
        searchParams.nameEn = this.searchTerm.trim();
      }
    }

    this.secteurService.getSecteurs(searchParams).subscribe({
      next: (response) => {
        this.secteurs = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.updateFilteredSecteurs();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Erreur lors du chargement des secteurs';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private loadSecteursKpi(): void {
    this.secteurService.getSecteurKpi().subscribe({
      next: (count) => {
        this.totalSecteursCount = count;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du KPI:', error);
      }
    });
  }

  private updateFilteredSecteurs(): void {
    // Les données sont déjà filtrées par le backend
    this.filteredSecteurs = this.secteurs;
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.currentPage = 0; // Reset to first page when searching
    this.loadSecteurs();
  }

  getSecteurDisplayName(secteur: SecteurResponse): string {
    return this.currentLang === 'fr' ? secteur.nameFr : secteur.nameEn;
  }

  openAddSecteurModal(): void {
    this.showAddSecteurModal = true;
    this.showEditSecteurModal = false;
    this.editingId = null;
    this.secteurForm.reset();
  }

  openEditSecteurModal(secteur: SecteurResponse): void {
    this.showEditSecteurModal = true;
    this.showAddSecteurModal = false;
    this.editingId = secteur.id;
    this.secteurForm.patchValue({
      nameFr: secteur.nameFr,
      nameEn: secteur.nameEn
    });
  }

  closeModals(): void {
    this.showAddSecteurModal = false;
    this.showEditSecteurModal = false;
    this.editingId = null;
    this.secteurForm.reset();
  }

  onSubmit(): void {
    if (this.secteurForm.valid) {
      const secteurData: Secteur = {
        nameFr: this.secteurForm.get('nameFr')?.value.trim(),
        nameEn: this.secteurForm.get('nameEn')?.value.trim()
      };

      if (this.editingId) {
        this.updateSecteur(this.editingId, secteurData);
      } else {
        this.addSecteur(secteurData);
      }
    }
  }

  private addSecteur(secteurData: Secteur): void {
    this.loading = true;
    
    this.secteurService.saveSecteur(secteurData).subscribe({
      next: (response) => {
        this.closeModals();
        this.loadSecteurs();
        this.loadSecteursKpi();
        this.loading = false;
        // Optionnel: afficher un message de succès
        console.log(this.texts.secteurAdded);
      },
      error: (error) => {
        this.error = error.message || 'Erreur lors de l\'ajout du secteur';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private updateSecteur(id: number, secteurData: Secteur): void {
    this.loading = true;
    
    this.secteurService.updateSecteur(id, secteurData).subscribe({
      next: (response) => {
        this.closeModals();
        this.loadSecteurs();
        this.loading = false;
        // Optionnel: afficher un message de succès
        console.log(this.texts.secteurUpdated);
      },
      error: (error) => {
        this.error = error.message || 'Erreur lors de la modification du secteur';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  editSecteur(secteur: SecteurResponse): void {
    this.openEditSecteurModal(secteur);
  }

  deleteSecteur(secteur: SecteurResponse): void {
    if (confirm(this.texts.confirmDelete)) {
      this.loading = true;
      
      this.secteurService.deleteSecteur(secteur.id).subscribe({
        next: () => {
          this.loadSecteurs();
          this.loadSecteursKpi();
          this.loading = false;
          // Optionnel: afficher un message de succès
          console.log(this.texts.secteurDeleted);
        },
        error: (error) => {
          this.error = error.message || 'Erreur lors de la suppression du secteur';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSecteurs();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadSecteurs();
  }

  // Utilitaire pour effacer les erreurs
  clearError(): void {
    this.error = null;
  }
}