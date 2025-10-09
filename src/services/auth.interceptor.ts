// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas ajouter le token pour les endpoints publics
    const publicEndpoints = ['/api/auth/signin', '/api/auth/signup', '/api/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => request.url.includes(endpoint));

    if (!isPublicEndpoint) {
      const token = this.authService.getToken();
      if (token) {
        request = this.addToken(request, token);
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isPublicEndpoint) {
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          console.error('Accès refusé (403). Token peut-être invalide ou expiré.');
          // Rediriger vers la page de connexion
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/login']);
          });
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((result: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(result.token);
          return next.handle(this.addToken(request, result.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/login']);
          });
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}