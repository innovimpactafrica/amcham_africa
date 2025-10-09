// secteur.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface Secteur {
  id?: number;
  nameFr: string;
  nameEn: string;
}

export interface SecteurResponse {
  id: number;
  nameFr: string;
  nameEn: string;
}

export interface SecteurPageResponse {
  content: SecteurResponse[];
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
  nameFr?: string;
  nameEn?: string;
}

// Interface pour les pays
export interface Country {
  id: number;
  name: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecteurService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les pays - GET /api/countries
   */
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/api/countries`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un pays par son ID - GET /api/countries/{id}
   */
  getCountryById(id: number): Observable<Country> {
    return this.http.get<Country>(`${this.baseUrl}/api/countries/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sauvegarder un secteur - POST /api/sectors
   */
  saveSecteur(secteurData: Secteur): Observable<SecteurResponse> {
    return this.http.post<SecteurResponse>(`${this.baseUrl}/api/sectors`, secteurData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir tous les secteurs avec pagination - GET /api/sectors
   */
  getSecteurs(params?: SearchParams): Observable<SecteurPageResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.nameFr) {
      httpParams = httpParams.set('nameFr', params.nameFr);
    }
    if (params?.nameEn) {
      httpParams = httpParams.set('nameEn', params.nameEn);
    }

    return this.http.get<SecteurPageResponse>(`${this.baseUrl}/api/sectors`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir tous les secteurs sans pagination - GET /api/sectors/all
   */
  getAllSecteurs(): Observable<SecteurResponse[]> {
    return this.http.get<SecteurResponse[]>(`${this.baseUrl}/api/sectors/all`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un secteur par son ID - GET /api/sectors/{id}
   */
  getSecteurById(id: number): Observable<SecteurResponse> {
    return this.http.get<SecteurResponse>(`${this.baseUrl}/api/sectors/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour un secteur - PUT /api/sectors/{id}
   */
  updateSecteur(id: number, secteurData: Secteur): Observable<SecteurResponse> {
    return this.http.put<SecteurResponse>(`${this.baseUrl}/api/sectors/${id}`, secteurData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer un secteur - DELETE /api/sectors/{id}
   */
  deleteSecteur(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/sectors/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir le KPI du nombre total de secteurs - GET /api/sectors/total/kpi
   */
  getSecteurKpi(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/sectors/total/kpi`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Rechercher des secteurs - GET /api/sectors/search
   */
  searchSecteurs(query: string): Observable<SecteurResponse[]> {
    return this.http.get<SecteurResponse[]>(`${this.baseUrl}/api/sectors/search`, {
      params: { query }
    })
      .pipe(
        catchError(this.handleError)
      );
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
    
    console.error('Erreur SecteurService:', error);
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
        return 'Ressource non trouvée';
      case 409:
        return 'Une ressource avec ce nom existe déjà';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return 'Erreur de connexion';
    }
  }
}