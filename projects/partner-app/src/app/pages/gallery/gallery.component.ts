import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IMAGES } from '../../core/constants/images';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  images = IMAGES; // In case you need it elsewhere

  galleryImages = [
    IMAGES.BIVOUAC_SAFARI,
    IMAGES.HERO_SUNSET,
    IMAGES.DUNES_LANDSCAPE,
    IMAGES.QUAD_EXCURSION,
    IMAGES.STARRY_NIGHT,
    IMAGES.LUXURY_TENT,
    IMAGES.BEDOUIN_DINNER,
    IMAGES.CAMEL_RIDE
  ];
}