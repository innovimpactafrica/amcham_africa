import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MembreComponent } from './components/membre/membre.component';
import { DetailsMembreComponent } from './components/details-membre/details-membre.component';
import { LoginComponent } from './components/login/login.component';
import { AproposComponent } from './components/apropos/apropos.component';
import { MediaComponent } from './components/media/media.component';
import { HoraireComponent } from './components/horaire/horaire.component';
import { StatistiqueComponent } from './components/statistique/statistique.component';
import { MembresComponent } from './components/membres/membres.component';
import { BanniereComponent } from './components/banniere/banniere.component';
import { AnnoncesComponent } from './components/annonces/annonces.component';
import { StaticComponent } from './components/static/static.component';
import { AmchamsComponent } from './components/amchams/amchams.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { SecteursComponent } from './components/secteurs/secteurs.component';

export const routes: Routes = [
    { path: '', component: HomeComponent }, // Route pour la page d'accueil
    { path: 'membres', component: MembreComponent }, // Route pour la liste des membres
    { path: 'login', component: LoginComponent }, // Route pour la page de connexion
    { path: 'membre/:id', component: DetailsMembreComponent }, // Route pour les détails d'un membre avec paramètre ID
    { path: 'apropos', component: AproposComponent }, // Route pour la page de connexion
    { path: 'media', component: MediaComponent }, // Route pour la page de connexion
    { path: 'horaire', component: HoraireComponent }, // Route pour la page de connexion
    { path: 'statistique', component: StatistiqueComponent }, // Route pour la page de connexion
    { path: 'members', component: MembresComponent }, // Route pour la page de Membres
    { path: 'banners', component: BanniereComponent }, // Route pour la page de Banners
    { path: 'announcements', component: AnnoncesComponent }, // Route pour la page de annonce
    { path: 'statistics', component: StaticComponent }, // Route pour la page de statistics
    { path: 'amcham', component: AmchamsComponent }, // Route pour la page de statistics
    { path: 'categories', component: CategoriesComponent }, // Route pour la page de statistics
    { path: 'secteurs', component: SecteursComponent }, // Route pour la page de statistics
    
    
    { path: '**', redirectTo: '' }, // Redirection pour les routes non trouvées

    
];