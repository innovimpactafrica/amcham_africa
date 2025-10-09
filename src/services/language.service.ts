// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('fr');
  public currentLang$ = this.currentLangSubject.asObservable();

  constructor() {}

  setLanguage(lang: string) {
    this.currentLangSubject.next(lang);
    // Sauvegarder dans le localStorage pour persister
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLanguage(): string {
    return this.currentLangSubject.value;
  }

  initializeLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.currentLangSubject.next(savedLang);
    }
  }
}