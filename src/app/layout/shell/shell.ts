import { Component, signal, inject, OnInit } from '@angular/core';
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
  sidenavOpen = signal(true);

  ngOnInit() {
    this.keyboardService.init();
  }

  toggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }

  onMobileNavigate(sidenav: MatSidenav): void {
    if (window.innerWidth < 768) {
      sidenav.close();
    }
  }
}
