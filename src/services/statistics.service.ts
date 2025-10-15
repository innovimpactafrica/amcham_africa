// statistics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces pour les types de retour
export interface VueProfilData {
  date: string;
  count: number;
}

export interface ChronologieStats {
  today: number;
  lastWeek: number;
  lastMonth: number;
  currentYear: number;
}

export interface VueProfilTotal {
  total: number;
  thisWeek: number;
  lastWeek: number;
  weeklyEvolution: number;
}

export interface ContactRecuStats {
  total: number;
  weeklyEvolution: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les vues de profil hebdomadaires et quotidiennes
   * GET /api/companies/views/company/{companyId}/weekly-daily
   */
  getVueProfil(companyId: number): Observable<VueProfilData[]> {
    return this.http.get<VueProfilData[]>(
      `${this.baseUrl}/api/companies/views/company/${companyId}/weekly-daily`
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtenir le total des vues de profil et l'évolution hebdomadaire
   * GET /api/companies/views/company/{companyId}
   */
  getVueProfilTotal(companyId: number): Observable<VueProfilTotal> {
    return this.http.get<VueProfilTotal>(
      `${this.baseUrl}/api/companies/views/company/${companyId}`
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtenir les statistiques de chronologie des contacts
   * GET /api/companies/contacts/{companyId}/circular-stats
   */
  getChronologie(companyId: number): Observable<ChronologieStats> {
    return this.http.get<ChronologieStats>(
      `${this.baseUrl}/api/companies/contacts/${companyId}/circular-stats`
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtenir le total des contacts reçus et l'évolution hebdomadaire
   * GET /api/companies/contacts/total/{companyId}
   */
  getContactRecu(companyId: number): Observable<ContactRecuStats> {
    return this.http.get<ContactRecuStats>(
      `${this.baseUrl}/api/companies/contacts/total/${companyId}`
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue dans le service statistique';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('❌ [StatisticsService] Erreur:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });
    
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
    // Si l'erreur contient un message personnalisé du backend
    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }

    // Messages par défaut selon le code HTTP
    switch (status) {
      case 0:
        return 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      case 400:
        return 'Données invalides pour la requête statistique';
      case 401:
        return 'Non autorisé à accéder aux statistiques';
      case 403:
        return 'Accès interdit aux statistiques';
      case 404:
        return 'Statistiques non trouvées pour cette entreprise';
      case 500:
        return 'Erreur interne du serveur lors du traitement des statistiques';
      case 503:
        return 'Service temporairement indisponible';
      default:
        return `Erreur de connexion (${status}) lors de la récupération des statistiques`;
    }
  }
}