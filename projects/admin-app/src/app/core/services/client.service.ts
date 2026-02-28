import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Client } from '../models/admin.models';

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private clients$ = new BehaviorSubject<Client[]>(this.getMockClients());

    constructor() { }

    /**
     * Get all clients
     */
    getClients(): Observable<Client[]> {
        return this.clients$.asObservable();
    }

    /**
     * Get only Partenaire clients (for reservation form dropdown)
     */
    getPartenaireClients(): Observable<Client[]> {
        return of(this.clients$.value.filter(c => c.type === 'Partenaire'));
    }

    /**
     * Get client by ID
     */
    getClientById(id: string): Observable<Client | undefined> {
        return of(this.clients$.value.find(c => c.id === id));
    }

    /**
     * Create new client
     */
    createClient(client: Omit<Client, 'id' | 'dateCreation'>): Observable<Client> {
        const newClient: Client = {
            ...client,
            id: this.generateId(),
            dateCreation: new Date()
        };

        const currentClients = this.clients$.value;
        this.clients$.next([...currentClients, newClient]);

        return of(newClient);
    }

    /**
     * Update existing client
     */
    updateClient(id: string, updates: Partial<Client>): Observable<Client | null> {
        const clients = this.clients$.value;
        const index = clients.findIndex(c => c.id === id);

        if (index === -1) {
            return of(null);
        }

        const updatedClient = { ...clients[index], ...updates };
        clients[index] = updatedClient;
        this.clients$.next([...clients]);

        return of(updatedClient);
    }

    /**
     * Delete client
     */
    deleteClient(id: string): Observable<boolean> {
        const clients = this.clients$.value.filter(c => c.id !== id);
        this.clients$.next(clients);
        return of(true);
    }

    /**
     * Search clients by name, email, or phone
     */
    searchClients(term: string): Observable<Client[]> {
        const lowerTerm = term.toLowerCase();
        const filtered = this.clients$.value.filter(c =>
            c.nom.toLowerCase().includes(lowerTerm) ||
            c.email.toLowerCase().includes(lowerTerm) ||
            c.telephone.includes(term)
        );
        return of(filtered);
    }

    /**
     * Filter clients by type
     */
    filterByType(type: 'Passagère' | 'Partenaire' | 'all'): Observable<Client[]> {
        if (type === 'all') {
            return this.getClients();
        }
        return of(this.clients$.value.filter(c => c.type === type));
    }

    private generateId(): string {
        return 'CLI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    private getMockClients(): Client[] {
    return [
        {
            id: 'CLI-001',
            nom: 'Bonheur Voyage',
            adresse: '15 Avenue Habib Bourguiba, Tunis',
            telephone: '+216 71 234 567',
            email: 'contact@bonheur-voyage.tn',
            matriculeFiscale: '1234567A',
            type: 'Partenaire',
            dateCreation: new Date('2024-01-15')
        },
        {
            id: 'CLI-002',
            nom: 'Costa Travel',
            adresse: '28 Rue de la Liberté, Sousse',
            telephone: '+216 73 543 210',
            email: 'info@costa-travel.tn',
            matriculeFiscale: '7654321B',
            type: 'Partenaire',
            dateCreation: new Date('2024-02-20')
        },
        {
            id: 'CLI-003',
            nom: 'Desert Rose Service',
            adresse: '42 Boulevard du Sahara, Tozeur',
            telephone: '+216 76 987 654',
            email: 'booking@desert-rose.tn',
            matriculeFiscale: '9876543C',
            type: 'Partenaire',
            dateCreation: new Date('2024-03-10')
        },
        {
            id: 'CLI-004',
            nom: 'Ste Nasri Tour Travel',
            adresse: '67 Avenue Mohamed V, Sfax',
            telephone: '+216 74 111 222',
            email: 'contact@nasri-tour.tn',
            matriculeFiscale: '1112223D',
            type: 'Partenaire',
            dateCreation: new Date('2024-04-05')
        },
        {
            id: 'CLI-005',
            nom: 'Travel Sun',
            adresse: '91 Rue de Carthage, La Marsa',
            telephone: '+216 71 333 444',
            email: 'info@travel-sun.tn',
            matriculeFiscale: '3334445E',
            type: 'Partenaire',
            dateCreation: new Date('2024-05-12')
        },
        {
            id: 'CLI-006',
            nom: 'Rawia Travel',
            adresse: '123 Avenue de la République, Monastir',
            telephone: '+216 73 555 666',
            email: 'contact@rawia-travel.tn',
            matriculeFiscale: '5556667F',
            type: 'Partenaire',
            dateCreation: new Date('2024-06-01')
        },
        {
            id: 'CLI-007',
            nom: 'Hannon Travel',
            adresse: '34 Rue de Marseille, Bizerte',
            telephone: '+216 72 777 888',
            email: 'booking@hannon-travel.tn',
            matriculeFiscale: '7778889G',
            type: 'Partenaire',
            dateCreation: new Date('2024-07-10')
        },
        {
            id: 'CLI-008',
            nom: 'Djerba Activities Dreams',
            adresse: '56 Avenue Farhat Hached, Houmt Souk, Djerba',
            telephone: '+216 75 999 000',
            email: 'info@djerba-dreams.tn',
            matriculeFiscale: '9990001H',
            type: 'Partenaire',
            dateCreation: new Date('2024-08-15')
        },
        {
            id: 'CLI-009',
            nom: 'Inventa Tourisme',
            adresse: '78 Boulevard 7 Novembre, Tunis',
            telephone: '+216 71 111 222',
            email: 'contact@inventa-tourisme.tn',
            matriculeFiscale: '1112223I',
            type: 'Partenaire',
            dateCreation: new Date('2024-09-20')
        },
        {
            id: 'CLI-010',
            nom: 'Lotos Voyages',
            adresse: '45 Avenue Hédi Chaker, Sfax',
            telephone: '+216 74 333 444',
            email: 'info@lotos-voyages.tn',
            matriculeFiscale: '3334445J',
            type: 'Partenaire',
            dateCreation: new Date('2024-10-05')
        },
        {
            id: 'CLI-011',
            nom: 'Kantaoui Travel',
            adresse: '89 Port El Kantaoui, Sousse',
            telephone: '+216 73 555 666',
            email: 'booking@kantaoui-travel.tn',
            matriculeFiscale: '5556667K',
            type: 'Partenaire',
            dateCreation: new Date('2024-11-12')
        },
        {
            id: 'CLI-012',
            nom: 'Hadrumétre Voyage',
            adresse: '23 Avenue Ali Belhouane, Sousse',
            telephone: '+216 73 777 888',
            email: 'contact@hadrumetre-voyage.tn',
            matriculeFiscale: '7778889L',
            type: 'Partenaire',
            dateCreation: new Date('2024-12-01')
        },
        {
            id: 'CLI-013',
            nom: 'Touil Travel',
            adresse: '67 Rue de la Kasbah, Tunis',
            telephone: '+216 71 999 000',
            email: 'info@touil-travel.tn',
            matriculeFiscale: '9990001M',
            type: 'Partenaire',
            dateCreation: new Date('2025-01-08')
        },
        {
            id: 'CLI-014',
            nom: 'Siroko',
            adresse: '12 Avenue Bourguiba, Hammamet',
            telephone: '+216 72 111 222',
            email: 'contact@siroko.tn',
            matriculeFiscale: '1112223N',
            type: 'Partenaire',
            dateCreation: new Date('2025-01-15')
        },
        {
            id: 'CLI-015',
            nom: 'Tunisian Colors Travel',
            adresse: '98 Avenue de France, Tunis',
            telephone: '+216 71 333 444',
            email: 'info@tunisian-colors.tn',
            matriculeFiscale: '3334445O',
            type: 'Partenaire',
            dateCreation: new Date('2025-01-22')
        }
    ];
}
}
