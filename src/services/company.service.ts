import { Country } from './country-amcham.service';
// company.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Ajoutez cette interface dans la section des interfaces
export interface CompanyScheduleRequest {
  dayOfWeek: string;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}

export interface RepartitionSector {
  sectorName: string;
  searchNumber: number;
}

export interface CompanySchedulesRequest {
  schedules: CompanyScheduleRequest[];
}
// Interfaces
export interface Company {
  value: any;
  countryId: number;
  sectorId: number;
  countryAmchamId: number;
  id: number;
  name: string;
  city: string;
  description: string;
  address: string;
  email: string;
  telephone: string;
  videoLink: string;
  countryAmcham: string;
  country: string;
  sector: string;
  webLink: string;
  logo: string;
  pictures: string[];
  updatedAt: string | null;

  lat: number;
  lon: number;
}
export interface SimilarCompany {
  id: number;
  name: string;
  description: string;
  address: string;
  email: string;
  telephone: string;
  videoLink: string | null;
  countryAmcham: string;
  country: string;
  sector: string;
  webLink: string;
  pictures: string[];
  lat: number;
  lon: number;
  updatedAt: string | null;
  logo: string;
}

// Ajoutez cette interface dans la section des interfaces
export interface CompanySchedule {
  dayOfWeek: string;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
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

export interface CompanyContactStats {
  today: number;
  lastWeek: number;
  lastMonth: number;
  currentYear: number;
}
export interface Ratings {
  firstName: string;
  lastName: string;
  comment: string;
  score: number;
  companyName: string;
}

export interface CompanyFormData {
  name: string;
  description: string;
  address: string;
  email: string;
  telephone: string;
  webLink: string;
  countryAmchamId: number;
  sectorId: number;
  pictures?: File[]; // Nouvelles photos à ajouter
  deletedPictures?: string[]; // URLs des photos à supprimer
  country: string;
  videoLink: string;
  logoFile?: File;
  lat: number;
  lon: number;
}

export interface SearchParams {
  page?: number;
  size?: number;
  name?: string;
  sector?: string;
  country?: string;
}

export interface CreateRatingRequest {
  firstName: string;
  lastName: string;
  comment: string;
  score: number;
  companyId: number;
}

export interface MembresParams {
  page?: number;
  size?: number;
  name?: string;
  sector?: string;
}
export interface SearchStats {
  total: number;
  thisWeek: number;
  lastWeek: number;
  weeklyEvolution: number;
}

export interface TotalCompany {
  totalCompanies: number;
  percentageChange: number;
  monthlyStats: { month: string; count: number }[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}
  /**
   * Sauvegarder une une rating - POST /api/ratings
   */

  saveRating(ratingData: CreateRatingRequest): Observable<any> {
    console.log(ratingData);

    return this.http
      .post(`${this.baseUrl}/api/ratings`, ratingData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Sauvegarder une entreprise - POST /api/companies/save
   */
  saveCompany(companyData: CompanyFormData): Observable<any> {
    const formData = this.createFormData(companyData);

    return this.http
      .post(`${this.baseUrl}/api/companies/save`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Rechercher des entreprises - GET /api/companies/search
   */
  getCompanySearch(params: SearchParams): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    // Paramètres de pagination
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    // Paramètres de recherche
    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params.sector) {
      httpParams = httpParams.set('sector', params.sector);
    }
    if (params.country) {
      httpParams = httpParams.set('country', params.country);
    }

    return this.http
      .get<CompanySearchResponse>(`${this.baseUrl}/api/companies/search`, {
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Mettre à jour les horaires d'une entreprise - PUT /api/companies/{id}/schedules
   */
  updateHoraire(
    companyId: number,
    schedules: CompanyScheduleRequest[]
  ): Observable<any> {
    const requestBody: CompanySchedulesRequest = { schedules };

    const headers = this.getAuthHeaders();

    return this.http
      .put(
        `${this.baseUrl}/api/companies/${companyId}/schedules`,
        requestBody,
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupération du token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  /**
   * Intercepteur pour ajouter le token aux requêtes
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
  getRatings(companyId: number): Observable<Ratings[]> {
    return this.http
      .get<Ratings[]>(`${this.baseUrl}/api/ratings/company/${companyId}`)
      .pipe(catchError(this.handleError));
  }
  /**
   * Obtenir Recherches populaires - GET /api/companies/top-sectors/kpi
   */
  getRepartitionSector(): Observable<RepartitionSector[]> {
    return this.http
      .get<RepartitionSector[]>(`${this.baseUrl}/api/companies/top-sectors/kpi`)
      .pipe(catchError(this.handleError));
  }
  // /api/companies/{id}/similar
  getSimilarCompanies(companyId: number): Observable<SimilarCompany[]> {
    return this.http
      .get<SimilarCompany[]>(
        `${this.baseUrl}/api/companies/${companyId}/similar`
      )
      .pipe(catchError(this.handleError));
  }
  /**
   * Obtenir les membres d'un pays AMCHAM - GET /api/companies/country-amcham/{countryAmchamId}
   */
  getMembres(
    countryAmchamId: number,
    params?: MembresParams
  ): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    // Paramètres de pagination
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    // Paramètres de recherche
    if (params?.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params?.sector) {
      httpParams = httpParams.set('sector', params.sector);
    }

    return this.http
      .get<CompanySearchResponse>(
        `${this.baseUrl}/api/companies/country-amcham/${countryAmchamId}`,
        { params: httpParams }
      )
      .pipe(catchError(this.handleError));
  }
  getSearchStats(): Observable<SearchStats> {
    return this.http
      .get<SearchStats>(`${this.baseUrl}/api/companies/search/stats`)
      .pipe(catchError(this.handleError));
  }
  /**
   * Obtenir les statistiques de contacts d'une entreprise - GET /api/companies/contacts/{companyId}/circular-stats
   */
  getCompanyContact(companyId: number): Observable<CompanyContactStats> {
    return this.http
      .get<CompanyContactStats>(
        `${this.baseUrl}/api/companies/contacts/${companyId}/circular-stats`
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir une entreprise par son ID
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http
      .get<Company>(`${this.baseUrl}/api/companies/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Mettre à jour une entreprise
   */
  updateCompany(
    companyId: number,
    companyData: CompanyFormData
  ): Observable<any> {
    const formData = this.createFormData(companyData);

    return this.http
      .put(`${this.baseUrl}/api/companies/${companyId}`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Supprimer une entreprise
   */
  deleteCompany(companyId: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/api/companies/${companyId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir toutes les entreprises sans pagination
   */
  getAllCompanies(): Observable<Company[]> {
    return this.http
      .get<Company[]>(`${this.baseUrl}/api/companies/all`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir les entreprises par secteur
   */
  getCompaniesBySector(
    sectorId: number,
    params?: { page?: number; size?: number }
  ): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http
      .get<CompanySearchResponse>(
        `${this.baseUrl}/api/companies/sector/${sectorId}`,
        { params: httpParams }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir les entreprises par pays
   */
  getCompaniesByCountry(
    country: string,
    params?: { page?: number; size?: number }
  ): Observable<CompanySearchResponse> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http
      .get<CompanySearchResponse>(
        `${this.baseUrl}/api/companies/country/${country}`,
        { params: httpParams }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir le nombre total d'entreprises
   */
  getTotalCompanies(): Observable<TotalCompany> {
    return this.http
      .get<TotalCompany>(`${this.baseUrl}/api/companies/total/kpi`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Créer FormData pour l'upload de fichiers
   */
  private createFormData(companyData: CompanyFormData): FormData {
    const formData = new FormData();

    // Ajouter les champs texte
    formData.append('name', companyData.name || '');
    formData.append('description', companyData.description || '');
    formData.append('address', companyData.address || '');
    formData.append('email', companyData.email || '');
    formData.append('telephone', companyData.telephone || '');
    formData.append('webLink', companyData.webLink || '');
    formData.append(
      'countryAmchamId',
      companyData.countryAmchamId?.toString() || ''
    );
    formData.append('sectorId', companyData.sectorId?.toString() || '');
    formData.append('videoLink', companyData.videoLink || '');
    formData.append('lat', companyData.lat?.toString() || '');
    formData.append('lon', companyData.lon?.toString() || '');

    // Ajouter le fichier logo si présent
    if (companyData.logoFile) {
      formData.append('logoFile', companyData.logoFile);
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

    console.error('Erreur CompanyService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error,
    }));
  }

  // Ajoutez cette méthode dans la classe CompanyService
  /**
   * Obtenir les horaires d'une entreprise - GET /api/companies/{id}/schedules
   */
  getHoraire(companyId: number): Observable<CompanySchedule[]> {
    return this.http
      .get<CompanySchedule[]>(
        `${this.baseUrl}/api/companies/${companyId}/schedules`
      )
      .pipe(catchError(this.handleError));
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
        return 'Données invalides';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Ressource non trouvée';
      case 409:
        return 'Une entreprise avec ce nom existe déjà';
      case 413:
        return 'Fichier trop volumineux';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return 'Erreur de connexion';
    }
  }
}
