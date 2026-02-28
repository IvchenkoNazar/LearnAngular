import { Component, signal, inject, OnInit, computed, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { Sidenav } from '../sidenav/sidenav';
import { Toolbar } from '../toolbar/toolbar';
import { KeyboardService } from '../../shared/services/keyboard.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatSidenavModule, Sidenav, Toolbar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private keyboardService = inject(KeyboardService);

  isMobile = signal(window.innerWidth < 768);
  sidenavOpen = computed(() => !this.isMobile());
  _sidenavOpen = signal(true);

  get effectiveSidenavOpen() {
    return this._sidenavOpen();
  }

  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');

  @HostListener('window:resize')
  onResize() {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (!mobile) this._sidenavOpen.set(true);
  }

  ngOnInit() {
    this.keyboardService.init();
    this._sidenavOpen.set(!this.isMobile());
  }

  toggleSidenav(): void {
    this._sidenavOpen.update(v => !v);
  }

  onMobileNavigate(sidenav: MatSidenav): void {
    if (this.isMobile()) {
      sidenav.close();
      this._sidenavOpen.set(false);
    }
  }
}
