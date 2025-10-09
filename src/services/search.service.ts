// search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces pour la recherche
export interface SearchParams {
  keyword?: string;
  sectorId?: number;
  countryId?: number;
  page?: number;
  size?: number;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  address: string;
  email: string;
  telephone: string;
  videoLink: string;
  countryAmcham: string;
  country: string;
  sector: string;
  webLink: string;
  pictures: string[];
  lat: number;
  lon: number;
  updatedAt: string | null;
}

export interface CompanySearchResponse {
  content: Company[];
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

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Rechercher des entreprises avec filtres
   * GET /api/companies/search
   */
  searchCompanies(params?: SearchParams): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    // Paramètres de recherche
    if (params?.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }
    if (params?.sectorId) {
      httpParams = httpParams.set('sectorId', params.sectorId.toString());
    }
    if (params?.countryId) {
      httpParams = httpParams.set('countryId', params.countryId.toString());
    }

    // Paramètres de pagination
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<CompanySearchResponse>(
      `${this.baseUrl}/api/companies/search`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Recherche avancée avec plus de filtres (si disponibles)
   */
  advancedSearch(params: {
    keyword?: string;
    sectorId?: number;
    countryId?: number;
    countryAmchamId?: number;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    // Paramètres de recherche
    if (params.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }
    if (params.sectorId) {
      httpParams = httpParams.set('sectorId', params.sectorId.toString());
    }
    if (params.countryId) {
      httpParams = httpParams.set('countryId', params.countryId.toString());
    }
    if (params.countryAmchamId) {
      httpParams = httpParams.set('countryAmchamId', params.countryAmchamId.toString());
    }

    // Paramètres de pagination
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    // Paramètres de tri
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<CompanySearchResponse>(
      `${this.baseUrl}/api/companies/search`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Recherche rapide par mot-clé seulement
   */
  quickSearch(keyword: string, page: number = 0, size: number = 10): Observable<CompanySearchResponse> {
    return this.searchCompanies({
      keyword,
      page,
      size
    });
  }

  /**
   * Recherche par secteur seulement
   */
  searchBySector(sectorId: number, page: number = 0, size: number = 10): Observable<CompanySearchResponse> {
    return this.searchCompanies({
      sectorId,
      page,
      size
    });
  }

  /**
   * Recherche par pays seulement
   */
  searchByCountry(countryId: number, page: number = 0, size: number = 10): Observable<CompanySearchResponse> {
    return this.searchCompanies({
      countryId,
      page,
      size
    });
  }

  /**
   * Obtenir toutes les entreprises (sans filtres)
   */
  getAllCompanies(page: number = 0, size: number = 10): Observable<CompanySearchResponse> {
    return this.searchCompanies({
      page,
      size
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la recherche';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur SearchService:', error);
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
        return 'Paramètres de recherche invalides';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Aucun résultat trouvé';
      case 500:
        return 'Erreur interne du serveur';
      case 0:
        return 'Erreur de connexion au serveur';
      default:
        return `Erreur ${status}: Impossible d'effectuer la recherche`;
    }
  }
}