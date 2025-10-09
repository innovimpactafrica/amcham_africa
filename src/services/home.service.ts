// home.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface CompaniesKpiResponse {
  totalCompanies: number;
  percentageChange: number;
  monthlyStats: any | null;
}

// Interfaces mises à jour
export interface MembresParams {
  page?: number;
  size?: number;
  name?: string;
  sector?: string;
  sectorId?: number;
  countryId?: number;
  country?: string;
  id?:number;
  keyword?:string;
}


export interface AdResponse {
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

export interface AdPageResponse {
  content: AdResponse[];
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

export interface AdParams {
  page?: number;
  size?: number;
}


// "id": 6,
// "name": "Saham Assurance Sénégal",
// "description": "Compagnie d'assurance proposant des solutions d'assurance vie, non-vie et santé",
// "address": "Dakar, Sénégal",
// "email": "contact@saham.sn",
// "telephone": "+221 33 849 03 03",
// "videoLink": null,
// "countryAmcham": "Innov",
// "country": "Senegal",
// "sector": "Health",
// "webLink": "https://www.saham.sn",
// "pictures": [],
// "lat": 14.6928,
// "lon": -17.4467,
// "updatedAt": null,
// "logo": "93520973-5331-4545-9960-878617b29bfa.png"
export interface Company {
  id: number;
  name: string;
  city:string,
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
  lat: number;
  lon: number;
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
export interface CountryAmchamResponse {
  id: number;
  countryId: number;
  name: string;
  address: string;
  telephone: string;
  email: string;
  website: string;
  logoUrl?: string;
}
export interface HomeStats {
  totalContacts: number;
  totalCompanies: CompaniesKpiResponse;
  totalSectors: number;
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

export interface SearchParams {
  page?: number;
  size?: number;
  categoryId?: number;
  title?: string;
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

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}
  getSimilarMembres(params?: MembresParams): Observable<Company[]> {
  return this.http
    .get<Company[]>(`${this.baseUrl}/api/companies/${params!.id}/similar`)
    .pipe(catchError(this.handleError));
}
  /**
   * Obtenir le nombre total de contacts - GET /api/companies/contacts/kpi/global
   */
  getContacts(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/companies/contacts/kpi/global`)
      .pipe(
        catchError(this.handleError)
      );
  }
  

  /**
   * Obtenir les statistiques des entreprises - GET /api/companies/total/kpi
   */
  getCompanies(): Observable<CompaniesKpiResponse> {
    return this.http.get<CompaniesKpiResponse>(`${this.baseUrl}/api/companies/total/kpi`)
      .pipe(
        catchError(this.handleError)
      );
  }
/**
 * Obtenir les publicités du portail - GET /api/ads/portal
 */
getAds(params?: AdParams): Observable<AdPageResponse> {
  let httpParams = new HttpParams();
  
  if (params?.page !== undefined) {
    httpParams = httpParams.set('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    httpParams = httpParams.set('size', params.size.toString());
  }

  return this.http.get<AdPageResponse>(`${this.baseUrl}/api/ads/portal`, { params: httpParams })
    .pipe(
      catchError(this.handleError)
    );
}
getMemberImageUrl(logo: string): string {   
  return `https://wakana.online/repertoire_amchams/${logo}`;
}
/**
 * Obtenir l'URL complète de l'image web d'une publicité
 */
getAdWebImageUrl(webImg: string): string {
  return `https://wakana.online/repertoire_amchams/${webImg}`;
}

/**
 * Obtenir l'URL complète de l'image mobile d'une publicité
 */
getAdMobileImageUrl(mobileImg: string): string {
  return `https://wakana.online/repertoire_amchams/${mobileImg}`;
}
getCompanyImageUrl(picture: string): string {
  return `https://wakana.online/repertoire_amchams/${picture}`;
}
  /**
   * Obtenir le nombre total de secteurs - GET /api/sectors/total/kpi
   */
  getSectors(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/sectors/total/kpi`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir toutes les statistiques de la page d'accueil en une seule requête
   */
  getAllHomeStats(): Observable<HomeStats> {
    return new Observable<HomeStats>(observer => {
      let contacts: number = 0;
      let companies: CompaniesKpiResponse = { totalCompanies: 0, percentageChange: 0, monthlyStats: null };
      let sectors: number = 0;
      let completed = 0;
      const totalRequests = 3;

      const checkCompletion = () => {
        completed++;
        if (completed === totalRequests) {
          observer.next({
            totalContacts: contacts,
            totalCompanies: companies,
            totalSectors: sectors
          });
          observer.complete();
        }
      };

      // Requête pour les contacts
      this.getContacts().subscribe({
        next: (data) => {
          contacts = data;
          checkCompletion();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des contacts:', error);
          checkCompletion();
        }
      });

      // Requête pour les entreprises
      this.getCompanies().subscribe({
        next: (data) => {
          companies = data;
          checkCompletion();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des entreprises:', error);
          checkCompletion();
        }
      });

      // Requête pour les secteurs
      this.getSectors().subscribe({
        next: (data) => {
          sectors = data;
          checkCompletion();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des secteurs:', error);
          checkCompletion();
        }
      });
    });
  }

  /**
   * Obtenir les statistiques récentes (derniers 30 jours)
   */
  getRecentStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/home/recent-stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les entreprises récemment ajoutées
   */
  getRecentCompanies(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/home/recent-companies?limit=${limit}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les annonces récentes
   */
  getRecentAnnouncements(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/home/recent-announcements?limit=${limit}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors du chargement des données';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur HomeService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

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

      getAllCountryAmchams(): Observable<CountryAmchamResponse[]> {
        return this.http.get<CountryAmchamResponse[]>(`${this.baseUrl}/api/country-amchams`)
          .pipe(
            catchError(this.handleError)
          );
      }
/**
 * Obtenir les membres avec filtres - GET /api/companies/search
 */
getMembres(params?: MembresParams): Observable<CompanySearchResponse> {
  let httpParams = new HttpParams();
  
  // Paramètres de pagination
  if (params?.page !== undefined) {
    httpParams = httpParams.set('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    httpParams = httpParams.set('size', params.size.toString());
  }
  
  // Paramètres de recherche
  if (params?.keyword) {
    httpParams = httpParams.set('keyword', params.keyword);
  }
  if (params?.sector) {
    httpParams = httpParams.set('sector', params.sector);
  }
  if (params?.sectorId) {
    httpParams = httpParams.set('sectorId', params.sectorId.toString());
  }
  if (params?.countryId) {
    httpParams = httpParams.set('countryId', params.countryId.toString());
  }
  if (params?.country) {
    httpParams = httpParams.set('country', params.country);
  }

  return this.http.get<CompanySearchResponse>(
    `${this.baseUrl}/api/companies/search`,
    { params: httpParams }
  ).pipe(
    catchError(this.handleError)
  );
}
  /**
   * Messages d'erreur selon le statut HTTP
   */
  private getErrorMessage(status: number, error?: any): string {
    switch (status) {
      case 400:
        return 'Données invalides';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Données non trouvées';
      case 500:
        return 'Erreur interne du serveur';
      case 0:
        return 'Erreur de connexion au serveur';
      default:
        return `Erreur ${status}: Impossible de charger les données`;
    }
  }
}