import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Invoice } from '../models/invoice.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  selectedInvoice: Invoice | null = null;
  showModal = false;
  showEditModal = false;
  editInvoice: Invoice | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.apiService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.cdr.detectChanges();
      },
      error: () => {
        // Handle error silently
      }
    });
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedInvoice = null;
  }

  openEditModal(invoice: Invoice): void {
    this.editInvoice = { ...invoice };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editInvoice = null;
  }

  saveInvoiceEdit(): void {
    if (!this.editInvoice || !this.editInvoice.id) return;

    const updateData = {
      customer_name: this.editInvoice.customer_name,
      customer_phone: this.editInvoice.customer_phone,
      payment_method: this.editInvoice.payment_method
    };

    this.apiService.updateInvoice(this.editInvoice.id, updateData).subscribe({
      next: () => {
        this.loadInvoices();
        this.closeEditModal();
      },
      error: () => {
        alert('Error updating invoice. Please try again.');
      }
    });
  }

  printInvoice(): void {
    window.print();
  }
}
