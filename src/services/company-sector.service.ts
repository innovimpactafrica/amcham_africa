// company-sector.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SectorKPI {
  sectorName: string;
  percentage: number;
  color: string;
}
export interface CliksKpi {
  id: number;
  title: string;
  clicks: number;

}
export interface VisitByDay{
  date: string;
  number: number;
}


@Injectable({
  providedIn: 'root'
})
export class CompanySectorService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les KPI des entreprises par secteur - GET /api/companies/companies-by-sector/kpi
   */
  getCompanyBySector(): Observable<SectorKPI[]> {
    return this.http.get<SectorKPI[]>(`${this.baseUrl}/api/companies/companies-by-sector/kpi`)
      .pipe(
        catchError(this.handleError)
      );
  }
  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }

  getVisitByDay(): Observable<VisitByDay[]> {
    return this.http.get<VisitByDay[]>(`${this.baseUrl}/api/companies/daily-visit`)
      .pipe(
        catchError(this.handleError)
      );
  }
getClicksKpi(): Observable<CliksKpi[]> {
    return this.http.get<CliksKpi[]>(`${this.baseUrl}/api/ads/kpi/top6`)
      .pipe(
        catchError(this.handleError)
      );
  }
    /**
   * Méthode utilitaire pour trier les secteurs par pourcentage (décroissant)
   */
    sortSectorsByPercentage(sectors: SectorKPI[]): SectorKPI[] {
      return sectors.sort((a, b) => b.percentage - a.percentage);
    }
  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la récupération des KPI par secteur';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getErrorMessage(error.status, error.error);
    }
    
    console.error('Erreur CompanySectorService:', error);
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
        return 'Requête invalide';
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