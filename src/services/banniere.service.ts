// banniere.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces pour les types de retour
export interface Banniere {
  id: number;
  webImg: string;
  mobileImg: string;
  title: string;
  description: string;
  link: string;
  startDate: string;
  endDate: string;
  permanent: boolean;
}

export interface BanniereSearchResponse {
  content: Banniere[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

export interface BanniereFormData {
  webImg?: File;
  mobileImg?: File;
  title: string;
  description: string;
  link: string;
  startDate: string;
  endDate: string;
  permanent: boolean;
}

export interface SearchParams {
  page?: number;
  size?: number;
  title?: string;
  permanent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BanniereService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Récupérer la liste des bannières - GET /api/ads/search
   */
  getBannieres(params?: SearchParams): Observable<BanniereSearchResponse> {
    let httpParams = new HttpParams();
    
    // Paramètres de pagination
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    
    // Paramètres de recherche
    if (params?.title) {
      httpParams = httpParams.set('title', params.title);
    }
    if (params?.permanent !== undefined) {
      httpParams = httpParams.set('permanent', params.permanent.toString());
    }

    return this.http.get<BanniereSearchResponse>(`${this.baseUrl}/api/ads/search`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer toutes les bannières sans pagination
   */
  getAllBannieres(): Observable<Banniere[]> {
    return this.http.get<Banniere[]>(`${this.baseUrl}/api/ads/all`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer une bannière par son ID - GET /api/ads/{id}
   */
  getBanniereById(id: number): Observable<Banniere> {
    return this.http.get<Banniere>(`${this.baseUrl}/api/ads/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer une nouvelle bannière - POST /api/ads/save
   */
  createBanniere(banniereData: BanniereFormData): Observable<any> {
    const formData = this.createFormData(banniereData);
    
    return this.http.post(`${this.baseUrl}/api/ads/save`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une bannière - PUT /api/ads/{id}
   */
  updateBanniere(id: number, banniereData: BanniereFormData): Observable<any> {
    const formData = this.createFormData(banniereData);
    
    return this.http.put(`${this.baseUrl}/api/ads/${id}`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une bannière - DELETE /api/ads/{id}
   */
  deleteBanniere(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/ads/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer FormData pour l'upload de fichiers
   */
  private createFormData(banniereData: BanniereFormData): FormData {
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('title', banniereData.title || '');
    formData.append('description', banniereData.description || '');
    formData.append('link', banniereData.link || '');
    formData.append('startDate', banniereData.startDate || '');
    formData.append('endDate', banniereData.endDate || '');
    formData.append('permanent', banniereData.permanent?.toString() || 'false');

    // Ajouter les fichiers images si présents
    if (banniereData.webImg) {
      formData.append('webImg', banniereData.webImg);
    }
    if (banniereData.mobileImg) {
      formData.append('mobileImg', banniereData.mobileImg);
    }

    return formData;
  }

  /**
   * Obtenir l'URL complète d'une image
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    
    // Si le chemin est déjà une URL complète, le retourner tel quel
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Sinon, construire l'URL complète
    return `${this.baseUrl}/api/ads/images/${imagePath}`;
  }

  /**
   * Obtenir les bannières actives (qui ne sont pas expirées)
   */
  getActiveBannieres(): Observable<Banniere[]> {
    return this.http.get<Banniere[]>(`${this.baseUrl}/api/ads/active`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les bannières permanentes
   */
  getPermanentBannieres(): Observable<Banniere[]> {
    return this.http.get<Banniere[]>(`${this.baseUrl}/api/ads/permanent`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue dans le service bannière';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur BanniereService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  /**
   * Messages d'erreur selon le statut HTTP
   */
  private getErrorMessage(status: number, error?: any): string {
    switch (status) {
      case 400:
        if (error?.message) {
          return error.message;
        }
        return 'Données invalides pour la bannière';
      case 401:
        return 'Non autorisé à accéder aux bannières';
      case 403:
        return 'Accès interdit aux bannières';
      case 404:
        return 'Bannière non trouvée';
      case 409:
        return 'Une bannière avec ce titre existe déjà';
      case 413:
        return 'Fichier trop volumineux';
      case 415:
        return 'Type de fichier non supporté';
      case 500:
        return 'Erreur interne du serveur lors du traitement de la bannière';
      default:
        return 'Erreur de connexion lors de la gestion des bannières';
    }
  }
}