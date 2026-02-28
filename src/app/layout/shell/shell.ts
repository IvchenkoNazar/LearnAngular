import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { Sidenav } from '../sidenav/sidenav';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatSidenavModule, Sidenav, Toolbar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  sidenavOpen = signal(true);

  toggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }

  onMobileNavigate(sidenav: MatSidenav): void {
    if (window.innerWidth < 768) {
      sidenav.close();
    }
  }
}
