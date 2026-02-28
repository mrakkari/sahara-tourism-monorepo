import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IMAGES } from '../../core/constants/images';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  images = IMAGES;
}