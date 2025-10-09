// partenaire.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface Partenaire {
  id: number;
  name: string;
  logo: string;
  link: string;
}

export interface PartenaireFormData {
  name: string;
  logoFile?: File;
  link: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les partenaires - GET /api/partners
   */
  getPartners(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.baseUrl}/api/partners`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un partenaire par son ID - GET /api/partners/{id}
   */
  getPartnerById(id: number): Observable<Partenaire> {
    return this.http.get<Partenaire>(`${this.baseUrl}/api/partners/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer un nouveau partenaire - POST /api/partners
   */
  createPartner(partenaireData: PartenaireFormData): Observable<Partenaire> {
    const formData = new FormData();
    formData.append('name', partenaireData.name);
    formData.append('link', partenaireData.link);
    
    if (partenaireData.logoFile) {
      formData.append('logoFile', partenaireData.logoFile);
    }

    return this.http.post<Partenaire>(`${this.baseUrl}/api/partners`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour un partenaire - PUT /api/partners/{id}
   */
  updatePartner(id: number, partenaireData: PartenaireFormData): Observable<Partenaire> {
    const formData = new FormData();
    formData.append('name', partenaireData.name);
    formData.append('link', partenaireData.link);
    
    if (partenaireData.logoFile) {
      formData.append('logoFile', partenaireData.logoFile);
    }

    return this.http.put<Partenaire>(`${this.baseUrl}/api/partners/${id}`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer un partenaire - DELETE /api/partners/{id}
   */
  deletePartner(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/partners/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir l'URL complète du logo
   */
  getLogoUrl(logoPath: string): string {
    if (!logoPath) {
      return '';
    }
    
    // Si le chemin est déjà une URL complète, le retourner tel quel
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // Sinon, construire l'URL complète
    return `${this.baseUrl}/api/files/${logoPath}`;
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors du chargement des partenaires';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur PartenaireService:', error);
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
        return 'Données du partenaire invalides';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Partenaire non trouvé';
      case 409:
        return 'Un partenaire avec ce nom existe déjà';
      case 500:
        return 'Erreur interne du serveur';
      case 0:
        return 'Erreur de connexion au serveur';
      default:
        return `Erreur ${status}: Impossible de charger les partenaires`;
    }
  }
}