import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Partner } from '../../models/partner.model';
import { TranslatePipe } from '../../core/services/translate.pipe';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    partner: Partner | null = null;
    loading = true;
    logoPreview: string | null = null;

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.partner = user;
            this.logoPreview = user?.logo || null;
            this.loading = false;
        });
    }

    onLogoUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size must be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.logoPreview = e.target?.result as string;
                this.authService.updateProfile({ logo: this.logoPreview });
            };
            reader.readAsDataURL(file);
        }
    }

    triggerFileInput(): void {
        const fileInput = document.getElementById('logoUpload') as HTMLInputElement;
        fileInput?.click();
    }
}