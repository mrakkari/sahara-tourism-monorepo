import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-camping-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './camping-header.component.html',
  styleUrls: ['./camping-header.component.scss']
})
export class CampingHeaderComponent {
  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}