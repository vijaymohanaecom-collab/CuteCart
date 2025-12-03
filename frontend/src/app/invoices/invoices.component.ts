import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  get isManager(): boolean {
    return this.authService.isManager();
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

  deleteInvoice(invoice: Invoice): void {
    if (!invoice.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete Invoice ${invoice.invoice_number}?\n\n` +
      `Customer: ${invoice.customer_name || 'Walk-in'}\n` +
      `Total: ₹${invoice.total?.toFixed(2)}\n\n` +
      `This will restore the stock levels for all products in this invoice.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        this.loadInvoices();
        alert('Invoice deleted successfully. Product stock levels have been restored.');
      },
      error: (error) => {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice. Please try again.');
      }
    });
  }
}
