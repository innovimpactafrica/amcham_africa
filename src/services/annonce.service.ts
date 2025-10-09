// annonce.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface Annonce {
  id?: number;
  title: string;
  description: string;
  imageFile?: File;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  address: string;
  categoryId: number;
}

export interface AnnonceResponse {
  id: number;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  address: string;
  category: {
    id: number;
    nameFr: string;
    nameEn: string;
    hibernateLazyInitializer?: any;
  };
}

export interface AnnoncePageResponse {
  content: AnnonceResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
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
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

export interface SearchParams {
  page?: number;
  size?: number;
  categoryId?: number;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les annonces à venir avec pagination - GET /api/events/upcoming
   */
  getAnnonces(params?: SearchParams): Observable<AnnoncePageResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId.toString());
    }
    if (params?.title) {
      httpParams = httpParams.set('title', params.title);
    }

    return this.http.get<AnnoncePageResponse>(`${this.baseUrl}/api/events/upcoming`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sauvegarder une annonce - POST /api/events/save
   */
  saveAnnonce(annonceData: Annonce): Observable<AnnonceResponse> {
    const formData = this.createFormData(annonceData);
    
    return this.http.post<AnnonceResponse>(`${this.baseUrl}/api/events/save`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir une annonce par son ID - GET /api/events/{id}
   */
  getAnnonceById(id: number): Observable<AnnonceResponse> {
    return this.http.get<AnnonceResponse>(`${this.baseUrl}/api/events/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une annonce - PUT /api/events/{id}
   */
  updateAnnonce(id: number, annonceData: Annonce): Observable<AnnonceResponse> {
    const formData = this.createFormData(annonceData);
    
    return this.http.put<AnnonceResponse>(`${this.baseUrl}/api/events/${id}`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une annonce - DELETE /api/events/{id}
   */
  deleteAnnonce(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/events/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir toutes les annonces (sans filtre à venir) - GET /api/events
   */
  getAllAnnonces(params?: SearchParams): Observable<AnnoncePageResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId.toString());
    }
    if (params?.title) {
      httpParams = httpParams.set('title', params.title);
    }

    return this.http.get<AnnoncePageResponse>(`${this.baseUrl}/api/events`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les annonces par catégorie - GET /api/events/category/{categoryId}
   */
  getAnnoncesByCategory(categoryId: number, params?: { page?: number; size?: number }): Observable<AnnoncePageResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<AnnoncePageResponse>(`${this.baseUrl}/api/events/category/${categoryId}`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer FormData pour l'upload de l'image
   */
  private createFormData(annonceData: Annonce): FormData {
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('title', annonceData.title || '');
    formData.append('description', annonceData.description || '');
    formData.append('startDate', annonceData.startDate || '');
    formData.append('endDate', annonceData.endDate || '');
    formData.append('startTime', annonceData.startTime || '');
    formData.append('endTime', annonceData.endTime || '');
    formData.append('address', annonceData.address || '');
    formData.append('categoryId', annonceData.categoryId?.toString() || '');
    
    // Ajouter le fichier image si présent
    if (annonceData.imageFile) {
      formData.append('imageFile', annonceData.imageFile);
    }

    return formData;
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur AnnonceService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  /**
   * Messages d'erreur selon le statut HTTP
   */
  private getErrorMessage(status: number, error: any): string {
    switch (status) {
      case 400:
        if (error.message) {
          return error.message;
        }
        return 'Données invalides';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Annonce non trouvée';
      case 409:
        return 'Une annonce avec ce titre existe déjà';
      case 413:
        return 'Fichier image trop volumineux';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return 'Erreur de connexion';
    }
  }
}