import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  username: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';
  private readonly AUTH_USERNAME = 'Swadeshchallan';
  private readonly AUTH_PASSWORD = 'password@challan';
  readonly isAuthenticated = signal(this.checkAuthentication());
  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());

  private checkAuthentication(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const user = this.getStoredUser();
    return !!user && user.username === this.AUTH_USERNAME;
  }

  private getStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const user = localStorage.getItem(this.STORAGE_KEY);
    if (!user) {
      return null;
    }

    try {
      const parsed = JSON.parse(user) as AuthUser;
      if (parsed.username !== this.AUTH_USERNAME) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): boolean {
    if (!username || !password) {
      return false;
    }

    if (username !== this.AUTH_USERNAME || password !== this.AUTH_PASSWORD) {
      return false;
    }

    const user: AuthUser = {
      username,
      displayName: 'Swadesh Challan User'
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    return true;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
