import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SafePipe } from '../../shared/components/pipes/safe.pipe';

@Component({
  selector: 'app-cta-video',
  standalone: true,
  imports: [CommonModule, RouterModule, SafePipe],
  templateUrl: './cta-video.component.html',
  styleUrls: ['./cta-video.component.scss']
})
export class CtaVideoComponent {
  // YouTube video embed URL
  youtubeVideoUrl = 'https://www.youtube.com/embed/slj2FI2gPjw?start=1';
  
  // Background image for the section
  ctaBackgroundImage = 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1920&q=80';
}