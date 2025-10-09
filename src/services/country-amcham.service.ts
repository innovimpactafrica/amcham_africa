// country-amcham.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface CountryAmcham {
  id?: number;
  countryId: number;
  name: string;
  address: string;
  telephone: string;
  email: string;
  website: string;
  logoFile?: File;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


export interface Country {
  id: number;
  name: string;
  icon: string;
} 

export interface CountryAmchamResponse {
  id: number;
  countryId: number;
  countryName: string;
  address: string;
  telephone: string;
  email: string;
  website: string;
  logo: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryAmchamService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}
   /**
   * Récupération du token
   */
   getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Créer les headers avec le token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Créer les headers pour FormData (sans Content-Type pour laisser le navigateur le définir)
   */
  private getFormDataHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Sauvegarder un pays AMCHAM - POST /api/country-amchams/save
   */
  saveCountryAmcham(countryAmchamData: CountryAmcham): Observable<CountryAmchamResponse> {
    const formData = this.createFormData(countryAmchamData);
    
    return this.http.post<CountryAmchamResponse>(
      `${this.baseUrl}/api/country-amchams/save`, 
      formData,
      { 
        headers: this.getFormDataHeaders(),
        withCredentials: true 
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtenir tous les pays AMCHAM - GET /api/country-amchams
   */
  getAllCountryAmchams(): Observable<CountryAmchamResponse[]> {
    return this.http.get<CountryAmchamResponse[]>(
      `${this.baseUrl}/api/country-amchams`,
      { 
        headers: this.getHeaders(),
        responseType: 'json',
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  // getAllCountryAmchams(): Observable<PagedResponse<CountryAmchamResponse>> {
  //   return this.http.get<PagedResponse<CountryAmchamResponse>>(`${this.apiUrl}/countryAmchams`);
  // }

  /**
   * Obtenir un pays AMCHAM par son ID - GET /api/country-amchams/{id}
   */
  getCountryAmchamById(id: number): Observable<CountryAmchamResponse> {
    return this.http.get<CountryAmchamResponse>(
      `${this.baseUrl}/api/country-amchams/${id}`,
      { 
        headers: this.getAuthHeaders()
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  /**
   * Mettre à jour un pays AMCHAM - PUT /api/country-amchams/{id}
   */
  updateCountryAmcham(id: number, countryAmchamData: CountryAmcham): Observable<CountryAmchamResponse> {
    const formData = this.createFormData(countryAmchamData);
    
    return this.http.put<CountryAmchamResponse>(
      `${this.baseUrl}/api/country-amchams/${id}`, 
      formData,
      { 
        headers: this.getFormDataHeaders(),
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtenir tous les pays - GET /api/countries
   */
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(
      `${this.baseUrl}/api/countries`,
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Supprimer un pays AMCHAM - DELETE /api/country-amchams/{id}
   */
  deleteCountryAmcham(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/api/country-amchams/${id}`,
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Rechercher des pays AMCHAM - GET /api/country-amchams/search
   */
  searchCountryAmchams(query: string): Observable<CountryAmchamResponse[]> {
    return this.http.get<CountryAmchamResponse[]>(
      `${this.baseUrl}/api/country-amchams/search`, 
      {
        params: { query },
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Créer FormData pour l'upload de fichiers
   */
  private createFormData(countryAmchamData: CountryAmcham): FormData {
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('countryId', countryAmchamData.countryId?.toString() || '');
    formData.append('name', countryAmchamData.name || '');
    formData.append('address', countryAmchamData.address || '');
    formData.append('telephone', countryAmchamData.telephone || '');
    formData.append('email', countryAmchamData.email || '');
    formData.append('website', countryAmchamData.website || '');
    
    // Ajouter le fichier logo si présent
    if (countryAmchamData.logoFile) {
      formData.append('logoFile', countryAmchamData.logoFile);
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
      errorMessage = this.getErrorMessage(error.status);
      
      // Si erreur d'authentification, suggérer de se reconnecter
      if (error.status === 401 || error.status === 403) {
        console.warn('Erreur d\'authentification. Token manquant ou invalide.');
        errorMessage += ' - Veuillez vous reconnecter.';
      }
    }
    
    console.error('Erreur CountryAmchamService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  /**
   * Messages d'erreur selon le statut HTTP
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Données invalides';
      case 401:
        return 'Non autorisé - Token manquant ou invalide';
      case 403:
        return 'Accès interdit - Authentification requise';
      case 404:
        return 'Ressource non trouvée';
      case 409:
        return 'Un pays AMCHAM avec ce nom existe déjà';
      case 413:
        return 'Fichier trop volumineux';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return 'Erreur de connexion';
    }
  }
}