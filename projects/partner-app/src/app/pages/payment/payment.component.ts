import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {

    constructor(private router: Router) {}

    goBack(): void {
        this.router.navigate(['/my-reservations']);
    }
}