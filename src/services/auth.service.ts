// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Interfaces
export interface AuthRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  telephone: string;
  profil: string;
}
export interface CurrentUser {

  id: number;
  name: string;
  email: string;
  telephone: string;
  profil: string;
  countryAmchamId: number | null;
  companyId: number | null;

}


export interface ResetPasswordRequest {
  email: string;
  password: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  email: string;
  password: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
}

export interface AuthResult {
  isSuccess: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'https://wakana.online/annuaire-amcham';
  
  // BehaviorSubjects pour gérer l'état d'authentification
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  /**
   * Initialise l'état d'authentification au démarrage
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const userData = localStorage.getItem('user_data');
    
    if (token && this.isTokenValid(token) && userData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else if (token) {
      // Token invalide, on nettoie
      this.clearAuthData();
    }
  }

  /**
   * Authentification - POST /api/auth/signin
   */
  authenticate(email: string, password: string): Observable<AuthResult> {
    const authRequest: AuthRequest = { email, password };

    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/signin`, authRequest)
      .pipe(
        tap(response => console.log('Réponse authentification:', response)),
        map(response => {
          if (response?.token && response?.refreshToken) {
            // Extraire les informations utilisateur du token
            const user = this.getUserFromToken(response.token);
            
            // Stocker les tokens et données utilisateur
            this.storeAuthData(response.token, response.refreshToken, user);
            
            // Mettre à jour les observables
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
            
            return {
              isSuccess: true,
              token: response.token,
              refreshToken: response.refreshToken,
              user: user
            };
          }
          
          return {
            isSuccess: false,
            errorMessage: 'Réponse invalide du serveur - tokens manquants'
          };
        }),
        catchError(this.handleError)
      );
  }
// Ajoutez cette méthode dans la classe AuthService
/**
 * Récupérer les informations de l'utilisateur connecté - GET /api/v1/user/me
 */
getCurrentUserFromAPI(): Observable<CurrentUser> {
  return this.http.get<CurrentUser>(`${this.baseUrl}/api/v1/user/me`,{

    headers: this.getAuthHeaders()
  })
    .pipe(
      tap(user => {
        // Mettre à jour les données utilisateur dans le localStorage et les observables
        this.currentUserSubject.next(user);
        localStorage.setItem('user_data', JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
}
  /**
   * Rafraîchir le token - POST /api/auth/refresh
   */
  refreshToken(): Observable<AuthResult> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => ({
        isSuccess: false,
        errorMessage: 'Aucun refresh token disponible'
      }));
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/refresh`, { refreshToken })
      .pipe(
        map(response => {
          if (response?.token && response?.refreshToken) {
            const user = this.getUserFromToken(response.token);
            this.storeAuthData(response.token, response.refreshToken, user);
            
            return {
              isSuccess: true,
              token: response.token,
              refreshToken: response.refreshToken,
              user: user
            };
          }
          
          return {
            isSuccess: false,
            errorMessage: 'Échec du rafraîchissement du token'
          };
        }),
        catchError(error => {
          // En cas d'erreur de rafraîchissement, déconnecter l'utilisateur
          this.clearAuthData();
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          
          return throwError(() => ({
            isSuccess: false,
            errorMessage: 'Session expirée, veuillez vous reconnecter'
          }));
        })
      );
  }

  /**
   * Création d'utilisateur - POST /api/auth/signup
   */
  createUser(userData: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/signup`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Réinitialisation du mot de passe - POST /api/auth/password/reset
   */
  resetPassword(passwordData: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/password/reset`, passwordData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Changement de mot de passe - POST /api/auth/password/change/{id}
   */
  changePassword(id: number, passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/password/change/${id}`, passwordData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Déconnexion - GET /api/auth/logout
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    // Appel API de déconnexion si token disponible
    if (token) {
      return this.http.get(`${this.baseUrl}/api/auth/logout`)
        .pipe(
          tap(() => {
            this.clearAuthData();
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
          }),
          catchError(error => {
            // Même en cas d'erreur API, on déconnecte localement
            this.clearAuthData();
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
            return throwError(() => error);
          })
        );
    } else {
      // Déconnexion locale seulement
      this.clearAuthData();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      return new Observable(subscriber => {
        subscriber.next({ success: true });
        subscriber.complete();
      });
    }
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
    
    console.error('Erreur AuthService:', error);
    return throwError(() => ({
      isSuccess: false,
      errorMessage: errorMessage,
      httpError: error
    }));
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
        return 'Requête invalide';
      case 401:
        return 'Email ou mot de passe incorrect';
      case 403:
        return 'Accès non autorisé';
      case 404:
        return 'Service non trouvé';
      case 409:
        return 'Un utilisateur avec cet email existe déjà';
      case 500:
        return 'Erreur interne du serveur';
      case 0:
        return 'Erreur de connexion au serveur';
      default:
        return 'Erreur inconnue';
    }
  }

  /**
   * Stockage des données d'authentification
   */
  private storeAuthData(token: string, refreshToken: string, user: any): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Nettoyage des données d'authentification
   */
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Récupération du token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Récupération du refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Vérification de la validité du token (basique)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  /**
   * Extraction des informations utilisateur depuis le token JWT
   */
  private getUserFromToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        profil: payload.profil,
        sub: payload.sub, // téléphone probablement
        iat: payload.iat,
        exp: payload.exp
      };
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return {
        userId: 'unknown',
        profil: 'unknown',
        sub: 'unknown'
      };
    }
  }

  /**
   * Vérifier si le token est sur le point d'expirer (dans les 5 minutes)
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - now;
      
      // Considérer comme bientôt expiré si moins de 5 minutes
      return timeUntilExpiry < 300;
    } catch {
      return true;
    }
  }

  /**
   * Méthodes utilitaires pour les composants
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  /**
   * Vérifier le profil de l'utilisateur
   */
  getUserProfil(): string {
    const user = this.getCurrentUser();
    return user?.profil || 'unknown';
  }

  /**
   * Vérifier si l'utilisateur a un profil spécifique
   */
  hasProfil(profil: string): boolean {
    return this.getUserProfil() === profil;
  }

  /**
   * Méthode pour forcer le refresh de l'état d'authentification
   */
  checkAuthStatus(): void {
    const token = this.getToken();
    const hasValidToken = token && this.isTokenValid(token);
    
    if (hasValidToken) {
      const user = this.getUserFromToken(token);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuthData();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Intercepteur pour ajouter le token aux requêtes
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}