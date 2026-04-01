import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  readonly toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  success(title: string, message: string, durationMs = 5000): void {
    this.show({ title, message, variant: 'success', durationMs });
  }

  error(title: string, message: string, durationMs = 5000): void {
    this.show({ title, message, variant: 'danger', durationMs });
  }

  info(title: string, message: string, durationMs = 5000): void {
    this.show({ title, message, variant: 'info', durationMs });
  }

  warning(title: string, message: string, durationMs = 5000): void {
    this.show({ title, message, variant: 'warning', durationMs });
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((item) => item.id !== id));
  }

  private show(input: Omit<ToastMessage, 'id'>): void {
    const id = ++this.counter;
    const toast: ToastMessage = { id, ...input };
    this.toasts.update((list) => [...list, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, input.durationMs);
  }
}