import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HeaderMembreComponent } from "../header-membre/header-membre.component";
import { LanguageService } from '../../../services/language.service';
import { CompanyService, Company } from '../../../services/company.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, HeaderMembreComponent],
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit, OnDestroy {
  // Données dynamiques de l'entreprise
  companyData: Company | null = null;
  isLoading = true;
  errorMessage = '';
  
  // Photos et vidéo chargées depuis l'API
  photos: string[] = [];
  videoUrl: string = '';
  
  currentRoute: string;
  private langSubscription!: Subscription;
  currentLang = 'fr';

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
      saveSuccess: 'Les modifications ont été enregistrées avec succès !',
      fileTypeError: 'Seuls les fichiers image (PNG, JPG) sont acceptés',
      fileSizeError: 'La taille de l\'image ne doit pas dépasser 2MB',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.exemple.us',
      profilePreview: 'Aperçu du profil public',
      loading: 'Chargement des médias...',
      errorLoading: 'Erreur lors du chargement des médias'
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
      saveSuccess: 'Changes have been saved successfully!',
      fileTypeError: 'Only image files (PNG, JPG) are accepted',
      fileSizeError: 'Image size must not exceed 2MB',
      companyName: 'Global Tech Solutions',
      companySector: 'Finance',
      companyAddress: '123 Innovation Street, Boston, MA 02110',
      companyPhone: '+1 555-123-4567',
      companyWebsite: 'www.example.us',
      profilePreview: 'Public profile preview',
      loading: 'Loading media...',
      errorLoading: 'Error loading media'
    };
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer,
    private languageService: LanguageService,
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
   */
  private loadCompanyData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔍 [Media] Chargement de l\'entreprise avec ID fixe: 1');

    // ✅ Appel direct avec companyId = 1
    this.companyService.getCompanyById(1).subscribe({
      next: (company: Company) => {
        console.log('✅ [Media] Entreprise chargée:', company);
        this.companyData = company;
        
        // Charger les photos depuis les pictures de l'entreprise
        if (company.pictures && company.pictures.length > 0) {
          this.photos = company.pictures;
        }
        
        // Charger l'URL de la vidéo
        if (company.videoLink) {
          this.videoUrl = company.videoLink;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [Media] Erreur chargement entreprise:', error);
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
  }

  onVideoUrlChange(event: any) {
    this.videoUrl = event.target.value;
  }

  saveChanges() {
    const mediaData = {
      photos: this.photos,
      videoUrl: this.videoUrl
    };
    
    console.log('Saving media data:', mediaData);
    
    // Simuler une sauvegarde réussie
    alert(this.texts.saveSuccess);
    
    // Ici vous pouvez ajouter la logique de sauvegarde
    // this.mediaService.updateMedia(mediaData).subscribe(
    //   response => {
    //     console.log('Media saved successfully', response);
    //   },
    //   error => {
    //     console.error('Error saving media', error);
    //   }
    // );
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