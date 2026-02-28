import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Client {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  mf: string;
  type: 'Partenaire' | 'Passagère';
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">👥 Liste des Clients</h1>
          </div>
          <button class="btn-add-client" (click)="openAddClientModal()">
            ➕ Ajouter Client
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher par nom ou mail..."
            [(ngModel)]="searchTerm"
            (input)="filterClients()"
            class="search-input"
          />
        </div>
      </div>

      <!-- Clients Table -->
      <div class="content-card">
        <table class="clients-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>MF</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let client of paginatedClients">
              <td><strong>{{ client.nom }}</strong></td>
              <td>{{ client.adresse }}</td>
              <td>{{ client.telephone }}</td>
              <td>{{ client.email }}</td>
              <td>{{ client.mf }}</td>
              <td>
                <span class="badge" [class.badge-partenaire]="client.type === 'Partenaire'" 
                                     [class.badge-passagere]="client.type === 'Passagère'">
                  {{ client.type }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-edit" (click)="editClient(client)">✏️</button>
                  <button class="btn-delete" (click)="deleteClient(client.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredClients.length === 0" class="no-results">
          <p>Aucun client trouvé</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredClients.length > 0" class="pagination">
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
          >
            ← Précédent
          </button>
          
          <div class="pagination-info">
            <span>Page {{ currentPage }} sur {{ totalPages }}</span>
            <span class="separator">|</span>
            <span>{{ filteredClients.length }} clients</span>
          </div>
          
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
          >
            Suivant →
          </button>
        </div>
      </div>

      <!-- Add Client Modal -->
      <div *ngIf="showAddModal" class="modal-overlay" (click)="closeAddClientModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ newClient.id ? '✏️ Modifier Client' : '➕ Nouveau Client' }}</h2>
            <button class="close-btn" (click)="closeAddClientModal()">✕</button>
          </div>

          <form class="client-form" (ngSubmit)="addClient()">
            <div class="form-group">
              <label>Nom</label>
              <input 
                type="text" 
                [(ngModel)]="newClient.nom"
                name="nom"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>Adresse</label>
              <input 
                type="text" 
                [(ngModel)]="newClient.adresse"
                name="adresse"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>Téléphone</label>
              <input 
                type="text" 
                [(ngModel)]="newClient.telephone"
                name="telephone"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                [(ngModel)]="newClient.email"
                name="email"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>Matricule Fiscale</label>
              <input 
                type="text" 
                [(ngModel)]="newClient.mf"
                name="mf"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>Type</label>
              <select 
                [(ngModel)]="newClient.type"
                name="type"
                class="form-control"
                required
              >
                <option value="Passagère">Passagère</option>
                <option value="Partenaire">Partenaire</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeAddClientModal()">
                Annuler
              </button>
              <button type="submit" class="btn-submit">
                {{ newClient.id ? '💾 Enregistrer' : '✅ Ajouter' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .btn-add-client {
      padding: 12px 24px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-add-client:hover {
      background: #059669;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .search-box {
      position: relative;
      max-width: 500px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
    }

    .content-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .clients-table {
      width: 100%;
      border-collapse: collapse;
    }

    .clients-table thead {
      background: #fef3c7;
    }

    .clients-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .clients-table td {
      padding: 16px;
      color: #475569;
      font-size: 0.95rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .clients-table tbody tr:hover {
      background: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-partenaire {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-passagere {
      background: #e9d5ff;
      color: #6b21a8;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-edit,
    .btn-delete {
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-edit {
      background: #dbeafe;
      color: #1e40af;
    }

    .btn-edit:hover {
      background: #bfdbfe;
    }

    .btn-delete {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-delete:hover {
      background: #fecaca;
    }

    .no-results {
      padding: 48px;
      text-align: center;
      color: #64748b;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .pagination-btn {
      padding: 8px 16px;
      background: white;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #3b82f6;
      color: white;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #e2e8f0;
      color: #94a3b8;
    }

    .pagination-info {
      display: flex;
      gap: 12px;
      align-items: center;
      color: #64748b;
      font-size: 0.9rem;
    }

    .separator {
      color: #cbd5e1;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      background: #f1f5f9;
      color: #475569;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .client-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 0.95rem;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #3b82f6;
    }

    select.form-control {
      cursor: pointer;
      background: white;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
    }

    .btn-submit {
      background: #10b981;
      color: white;
    }

    .btn-submit:hover {
      background: #059669;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .clients-table {
        font-size: 0.85rem;
      }

      .clients-table th,
      .clients-table td {
        padding: 12px 8px;
      }

      .modal-content {
        margin: 0 16px;
      }
    }
  `]
})
export class ClientsComponent {
  searchTerm: string = '';
  showAddModal: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // New client form
  newClient: Partial<Client> = {
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    mf: '',
    type: 'Passagère'
  };

  clients: Client[] = [
    { id: 1, nom: 'Bonheur voyage', adresse: 'Av. Habib Bourguiba, Tunis', telephone: '+216 71 123 456', email: 'contact@bonheurvoyage.tn', mf: '1234567A', type: 'Partenaire' },
    { id: 2, nom: 'costa travel', adresse: '45 Rue de la République, Sousse', telephone: '+216 73 234 567', email: 'info@costatravel.tn', mf: '2345678B', type: 'Partenaire' },
    { id: 3, nom: 'Desert Rose service', adresse: '12 Avenue Mohamed V, Tozeur', telephone: '+216 76 345 678', email: 'contact@desertroseservice.tn', mf: '3456789C', type: 'Partenaire' },
    { id: 4, nom: 'ste Nasri tour travel', adresse: '78 Boulevard du 7 Novembre, Sfax', telephone: '+216 74 456 789', email: 'info@nasritour.tn', mf: '4567890D', type: 'Partenaire' },
    { id: 5, nom: 'Travel Sun', adresse: '23 Rue Ibn Khaldoun, Hammamet', telephone: '+216 72 567 890', email: 'reservations@travelsun.tn', mf: '5678901E', type: 'Partenaire' },
    { id: 6, nom: 'Rawia Travel', adresse: '56 Avenue de Carthage, La Marsa', telephone: '+216 71 678 901', email: 'contact@rawiatravel.tn', mf: '6789012F', type: 'Partenaire' },
    { id: 7, nom: 'Hannon travel', adresse: '89 Rue de la Médina, Kairouan', telephone: '+216 77 789 012', email: 'info@hannontravel.tn', mf: '7890123G', type: 'Partenaire' },
    { id: 8, nom: 'Djerba activities dreams', adresse: '34 Boulevard de l\'Environnement, Djerba', telephone: '+216 75 890 123', email: 'contact@djerbaactivities.tn', mf: '8901234H', type: 'Partenaire' },
    { id: 9, nom: 'Inventa tourisme', adresse: '67 Avenue Farhat Hached, Bizerte', telephone: '+216 72 901 234', email: 'info@inventatourisme.tn', mf: '9012345I', type: 'Partenaire' },
    { id: 10, nom: 'lotos voyages', adresse: '91 Rue de Kairouan, Monastir', telephone: '+216 73 012 345', email: 'reservations@lotosvoyages.tn', mf: '0123456J', type: 'Partenaire' },
    { id: 11, nom: 'kantaoui travel', adresse: 'Port El Kantaoui, Sousse', telephone: '+216 73 123 456', email: 'contact@kantaouitravel.tn', mf: '1234567K', type: 'Partenaire' },
    { id: 12, nom: 'Hadrumétre voyage', adresse: '18 Avenue de la Liberté, Sousse', telephone: '+216 73 234 567', email: 'info@hadrumetre.tn', mf: '2345678L', type: 'Partenaire' },
    { id: 13, nom: 'Touil travel', adresse: '45 Boulevard Mohamed V, Gabès', telephone: '+216 75 345 678', email: 'contact@touiltravel.tn', mf: '3456789M', type: 'Partenaire' },
    { id: 14, nom: 'siroko', adresse: '72 Rue de Paris, Tunis', telephone: '+216 71 456 789', email: 'info@siroko.tn', mf: '4567890N', type: 'Partenaire' },
    { id: 15, nom: 'Tunisian Colors travel', adresse: '56 Avenue Bourguiba, Nabeul', telephone: '+216 72 567 890', email: 'contact@tunisiancolors.tn', mf: '5678901O', type: 'Partenaire' },
    // Individual passengers
    { id: 16, nom: 'Ahmed Ben Ali', adresse: '12 Rue de Paris, Tunis', telephone: '+216 98 123 456', email: 'ahmed.benali@email.com', mf: '', type: 'Passagère' },
    { id: 17, nom: 'Fatima Trabelsi', adresse: '34 Avenue de Carthage, La Marsa', telephone: '+216 22 345 678', email: 'fatima.trabelsi@email.com', mf: '', type: 'Passagère' },
    { id: 18, nom: 'Mohamed Gharbi', adresse: '56 Boulevard du 7 Novembre, Sfax', telephone: '+216 74 456 789', email: 'mohamed.gharbi@email.com', mf: '', type: 'Passagère' },
    { id: 19, nom: 'Leila Hammami', adresse: '78 Rue Ibn Khaldoun, Sousse', telephone: '+216 73 567 890', email: 'leila.hammami@email.com', mf: '', type: 'Passagère' },
    { id: 20, nom: 'Karim Mansouri', adresse: '91 Avenue Habib Bourguiba, Monastir', telephone: '+216 73 678 901', email: 'karim.mansouri@email.com', mf: '', type: 'Passagère' }
  ];

  filteredClients: Client[] = [...this.clients];
  paginatedClients: Client[] = [];

  constructor() {
    this.updatePagination();
  }

  filterClients(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch =
        client.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openAddClientModal(): void {
    this.showAddModal = true;
    this.newClient = {
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      mf: '',
      type: 'Passagère'
    };
  }

  closeAddClientModal(): void {
    this.showAddModal = false;
  }

  addClient(): void {
    if (this.newClient.nom && this.newClient.adresse && this.newClient.telephone) {
      if (this.newClient.id) {
        // Edit existing client
        const index = this.clients.findIndex(c => c.id === this.newClient.id);
        if (index !== -1) {
          this.clients[index] = {
            id: this.newClient.id,
            nom: this.newClient.nom!,
            adresse: this.newClient.adresse!,
            telephone: this.newClient.telephone!,
            email: this.newClient.email || '',
            mf: this.newClient.mf || '',
            type: this.newClient.type as 'Partenaire' | 'Passagère'
          };
        }
      } else {
        // Add new client
        const client: Client = {
          id: this.clients.length + 1,
          nom: this.newClient.nom!,
          adresse: this.newClient.adresse!,
          telephone: this.newClient.telephone!,
          email: this.newClient.email || '',
          mf: this.newClient.mf || '',
          type: this.newClient.type as 'Partenaire' | 'Passagère'
        };
        this.clients.unshift(client);
      }

      this.filterClients();
      this.closeAddClientModal();
    }
  }

  editClient(client: Client): void {
    console.log('Edit client:', client);
    this.newClient = { ...client };
    this.showAddModal = true;
    // Implement edit functionality
  }

  deleteClient(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client?')) {
      this.clients = this.clients.filter(c => c.id !== id);
      this.filterClients();
    }
  }

}