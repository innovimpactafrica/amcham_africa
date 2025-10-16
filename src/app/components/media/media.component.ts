import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CompanyService, Company, CompanyFormData } from '../../../services/company.service';
import { Subscription } from 'rxjs';
import { ProfilPublicComponent } from "../profil-public/profil-public.component";

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, HeaderMembreComponent, ProfilPublicComponent],
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit, OnDestroy {
  // Données dynamiques de l'entreprise
  companyData: Company | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  
  // Photos et vidéo chargées depuis l'API
  photos: string[] = [];
  photoFiles: File[] = []; // Nouveaux fichiers à uploader
  videoUrl: string = '';
  
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';
  logoFile: undefined;

  // Textes dynamiques
  get texts() {
    return this.currentLang === 'fr' ? {
      galleryTitle: 'Galerie photos',
      galleryDescription: 'Ajoutez des photos de votre entreprise, de vos produits ou de vos services pour les mettre en valeur sur votre profil.',
      addPhoto: 'Ajouter une photo',
      fileFormat: 'PNG, JPG (max. 2MB)',
      noPhotos: 'Aucune photo ajoutée',
      noPhotosDescription: 'Commencez par ajouter quelques photos pour présenter votre entreprise de manière attractive.',
      addPhotos: 'Ajouter des photos',
      deletePhoto: 'Supprimer la photo',
      videoTitle: 'Vidéo de présentation',
      videoDescription: 'Ajoutez une vidéo de présentation de votre entreprise pour la mettre en valeur sur votre profil.',
      videoUrlLabel: 'URL Vidéo (YouTube, Vimeo, etc.)',
      videoUrlPlaceholder: 'https://www.youtube.com/embed/dQw4w9WgXcQ0',
      videoUrlHelp: 'Collez l\'URL d\'intégration d\'une vidéo YouTube, Vimeo ou autre plateforme.',
      invalidUrl: 'URL de vidéo non valide. Veuillez vérifier le lien.',
      videoEmbedded: 'Vidéo intégrée avec succès',
      noVideo: 'Aucune vidéo ajoutée',
      noVideoDescription: 'Ajoutez une vidéo de présentation pour mettre en valeur votre entreprise.',
      invalidVideo: 'URL de vidéo invalide',
      invalidVideoDescription: 'Vérifiez que l\'URL de la vidéo est correcte et provient d\'une plateforme supportée.',
      deleteVideo: 'Supprimer la vidéo',
      saveButton: 'Enregistrer les modifications',
      saving: 'Enregistrement en cours...',
      saveSuccess: 'Les médias ont été enregistrés avec succès !',
      fileTypeError: 'Seuls les fichiers image (PNG, JPG) sont acceptés',
      fileSizeError: 'La taille de l\'image ne doit pas dépasser 2MB',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.exemple.us',
      profilePreview: 'Aperçu du profil public',
      loading: 'Chargement des médias...',
      errorLoading: 'Erreur lors du chargement des médias',
      errorSaving: 'Erreur lors de l\'enregistrement des modifications'
    } : {
      galleryTitle: 'Photo Gallery',
      galleryDescription: 'Add photos of your company, products or services to showcase them on your profile.',
      addPhoto: 'Add photo',
      fileFormat: 'PNG, JPG (max. 2MB)',
      noPhotos: 'No photos added',
      noPhotosDescription: 'Start by adding some photos to present your company in an attractive way.',
      addPhotos: 'Add photos',
      deletePhoto: 'Delete photo',
      videoTitle: 'Presentation Video',
      videoDescription: 'Add a presentation video of your company to showcase it on your profile.',
      videoUrlLabel: 'Video URL (YouTube, Vimeo, etc.)',
      videoUrlPlaceholder: 'https://www.youtube.com/embed/dQw4w9WgXcQ0',
      videoUrlHelp: 'Paste the embed URL of a YouTube, Vimeo or other platform video.',
      invalidUrl: 'Invalid video URL. Please check the link.',
      videoEmbedded: 'Video embedded successfully',
      noVideo: 'No video added',
      noVideoDescription: 'Add a presentation video to showcase your company.',
      invalidVideo: 'Invalid video URL',
      invalidVideoDescription: 'Check that the video URL is correct and comes from a supported platform.',
      deleteVideo: 'Delete video',
      saveButton: 'Save changes',
      saving: 'Saving...',
      saveSuccess: 'Media has been saved successfully!',
      fileTypeError: 'Only image files (PNG, JPG) are accepted',
      fileSizeError: 'Image size must not exceed 2MB',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.example.us',
      profilePreview: 'Public profile preview',
      loading: 'Loading media...',
      errorLoading: 'Error loading media',
      errorSaving: 'Error saving changes'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer,
    private languageService: LanguageService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    // S'abonner aux changements de langue
    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
    
    // Initialiser la langue
    this.currentLang = this.languageService.getCurrentLanguage();
    
    // Charger les données de l'entreprise
    this.loadCompanyData();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Charger les données de l'entreprise depuis l'API
   * Utilise getCurrentUserFromAPI() pour récupérer les données utilisateur fraîches
   */
  private loadCompanyData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Vérifier d'abord qu'on a un token valide
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = this.currentLang === 'fr'
        ? 'Session expirée. Veuillez vous reconnecter.'
        : 'Session expired. Please log in again.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }
    
    // Récupérer d'abord les informations utilisateur depuis l'API
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (currentUser) => {
        console.log('✅ [Media] Utilisateur récupéré avec succès:', currentUser);
        
        // Vérifier si l'utilisateur a une entreprise associée
        if (!currentUser.companyId) {
          this.errorMessage = this.currentLang === 'fr' 
            ? 'Aucune entreprise associée à votre compte'
            : 'No company associated with your account';
          this.isLoading = false;
          return;
        }

        console.log('🔍 [Media] Chargement de l\'entreprise avec ID:', currentUser.companyId);

        // Charger les données de l'entreprise avec le companyId récupéré
        this.companyService.getCompanyById(currentUser.companyId).subscribe({
          next: (company: Company) => {
            console.log('✅ [Media] Entreprise chargée avec succès:', company);
            this.companyData = company;
            
            // Charger les photos depuis les pictures de l'entreprise
            if (company.pictures && company.pictures.length > 0) {
              this.photos = [...company.pictures]; // Copie pour éviter les mutations
              console.log(`📸 [Media] ${this.photos.length} photos chargées`);
            }
            
            // Charger l'URL de la vidéo
            if (company.videoLink) {
              this.videoUrl = company.videoLink;
              console.log('🎬 [Media] Vidéo chargée:', this.videoUrl);
            }
            
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ [Media] Erreur lors du chargement de l\'entreprise:', error);
            this.errorMessage = this.texts.errorLoading;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ [Media] Erreur lors de la récupération des informations utilisateur:', error);
        
        // Gestion spécifique des erreurs d'authentification
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = this.currentLang === 'fr'
            ? 'Session expirée. Redirection vers la page de connexion...'
            : 'Session expired. Redirecting to login page...';
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = this.currentLang === 'fr'
            ? 'Erreur lors de la récupération de vos informations utilisateur'
            : 'Error retrieving your user information';
        }
        
        this.isLoading = false;
        
        // En cas d'erreur non-authentification, on peut essayer de fallback sur les données locales
        if (error.status !== 401 && error.status !== 403) {
          const localUser = this.authService.getCurrentUser();
          if (localUser?.companyId) {
            console.log('🔄 [Media] Tentative avec les données locales...');
            this.loadCompanyFromLocalUser(localUser.companyId);
          }
        }
      }
    });
  }

  /**
   * Méthode de fallback pour charger l'entreprise depuis les données locales
   */
  private loadCompanyFromLocalUser(companyId: number): void {
    this.companyService.getCompanyById(companyId).subscribe({
      next: (company: Company) => {
        this.companyData = company;
        
        // Charger les photos depuis les pictures de l'entreprise
        if (company.pictures && company.pictures.length > 0) {
          this.photos = [...company.pictures];
        }
        
        // Charger l'URL de la vidéo
        if (company.videoLink) {
          this.videoUrl = company.videoLink;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [Media] Erreur lors du chargement de l\'entreprise (fallback):', error);
        this.errorMessage = this.texts.errorLoading;
        this.isLoading = false;
      }
    });
  }

  onPhotoSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let file of files) {
        // Vérifier le type de fichier
        if (file.type.startsWith('image/')) {
          // Vérifier la taille (max 2MB)
          if (file.size <= 2 * 1024 * 1024) {
            // Ajouter le fichier à la liste des nouveaux fichiers
            this.photoFiles.push(file);
            
            // Créer un aperçu local
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                this.photos.push(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          } else {
            alert(this.texts.fileSizeError);
          }
        } else {
          alert(this.texts.fileTypeError);
        }
      }
    }
    
    // Reset input file
    event.target.value = '';
  }

  removePhoto(index: number) {
    this.photos.splice(index, 1);
    // Si c'est une nouvelle photo (pas encore enregistrée), supprimer aussi le fichier
    if (index >= (this.companyData?.pictures?.length || 0)) {
      const fileIndex = index - (this.companyData?.pictures?.length || 0);
      if (fileIndex >= 0 && fileIndex < this.photoFiles.length) {
        this.photoFiles.splice(fileIndex, 1);
      }
    }
  }

  onVideoUrlChange(event: any) {
    this.videoUrl = event.target.value;
  }

/**
   * Sauvegarder les modifications des médias
   */
saveChanges() {
  // Empêcher la soumission multiple
  if (this.isSaving) {
    return;
  }

  // Réinitialiser les messages
  this.successMessage = '';
  this.errorMessage = '';

  if (!this.companyData?.id) {
    this.errorMessage = this.currentLang === 'fr'
      ? 'Impossible de sauvegarder : ID de l\'entreprise manquant'
      : 'Cannot save: Company ID missing';
    return;
  }

  this.isSaving = true;

  console.log('💾 [Media] Sauvegarde des données médias...');
  console.log('📸 [Media] Nombre de photos affichées:', this.photos.length);
  console.log('📁 [Media] Nombre de nouveaux fichiers à uploader:', this.photoFiles.length);
  console.log('🎬 [Media] URL vidéo:', this.videoUrl);

  // Préparer les données en préservant TOUTES les valeurs existantes
  // et en ne modifiant QUE les médias (photos et vidéo)
  const companyFormData: CompanyFormData = {
    // Préserver toutes les valeurs existantes de l'entreprise
    name: this.companyData.name,
    sectorId: this.companyData.sectorId,
    description: this.companyData.description,
    country: this.companyData.countryId?.toString() || '',
    address: this.companyData.address,
    email: this.companyData.email,
    telephone: this.companyData.telephone,
    webLink: this.companyData.webLink,
    
    // Logo existant (pas de modification depuis cette page)
    logoFile: this.logoFile,
    
    // Préserver les autres champs
    countryAmchamId: this.companyData.countryAmchamId || 0,
    lat: this.companyData.lat || 0,
    lon: this.companyData.lon || 0,
    
    // MODIFIER UNIQUEMENT la vidéo (c'est ce qu'on veut mettre à jour)
    videoLink: this.videoUrl || '',
    
    // Ajouter UNIQUEMENT les nouveaux fichiers photos (pas les URLs existantes)
    // Les photos existantes restent sur le serveur, on ajoute seulement les nouvelles
    pictures: this.photoFiles.length > 0 ? this.photoFiles : undefined
  };

  console.log('📦 [Media] Données à envoyer:', companyFormData);
  console.log('📤 [Media] Fichiers photos à uploader:', this.photoFiles.length);

  // Appeler le service pour mettre à jour l'entreprise
  this.companyService.updateCompany(this.companyData.id, companyFormData).subscribe({
    next: (response) => {
      console.log('✅ [Media] Médias mis à jour avec succès:', response);
      this.successMessage = this.texts.saveSuccess;
      this.isSaving = false;
      
      // Réinitialiser les fichiers après l'envoi
      this.photoFiles = [];
      
      // Recharger les données de l'entreprise après 3 secondes
      setTimeout(() => {
        this.successMessage = '';
        this.loadCompanyData();
      }, 3000);
    },
    error: (error) => {
      console.error('❌ [Media] Erreur lors de la mise à jour:', error);
      this.errorMessage = error.message || this.texts.errorSaving;
      this.isSaving = false;
    }
  });
}

  getEmbedUrl(url: string): SafeResourceUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    let embedUrl = url;
    
    // Convertir l'URL YouTube en URL d'intégration si nécessaire
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  isValidVideoUrl(url: string): boolean {
    if (!url) return false;
    
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') ||
           url.includes('embed');
  }
}