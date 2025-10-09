// category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface Category {
  id?: number;
  nameFr: string;
  nameEn: string;
}

export interface CategoryResponse {
  id: number;
  nameFr: string;
  nameEn: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';

  constructor(private http: HttpClient) {}

  /**
   * Sauvegarder une catégorie - POST /api/categories
   */
  saveCategorie(categoryData: Category): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${this.baseUrl}/api/categories`, categoryData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir toutes les catégories - GET /api/categories
   */
  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.baseUrl}/api/categories`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir une catégorie par son ID - GET /api/categories/{id}
   */
  getCategorieById(id: number): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/api/categories/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une catégorie - PUT /api/categories/{id}
   */
  updateCategorie(id: number, categoryData: Category): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.baseUrl}/api/categories/${id}`, categoryData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une catégorie - DELETE /api/categories/{id}
   */
  deleteCategorie(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/categories/${id}`)
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
    
    console.error('Erreur CategoryService:', error);
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
        return 'Catégorie non trouvée';
      case 409:
        return 'Une catégorie avec ce nom existe déjà';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return 'Erreur de connexion';
    }
  }
}