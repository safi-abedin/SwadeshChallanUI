import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { App } from './app';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: App,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
