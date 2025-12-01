import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  editMode = false;
  currentProduct: Product = this.getEmptyProduct();

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  getEmptyProduct(): Product {
    return {
      name: '',
      description: '',
      price: 0,
      purchase_price: 0,
      stock: 0,
      barcode: '',
      category: ''
    };
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentProduct = this.getEmptyProduct();
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.editMode = true;
    this.currentProduct = { ...product };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentProduct = this.getEmptyProduct();
  }

  saveProduct(): void {
    if (this.editMode && this.currentProduct.id) {
      this.apiService.updateProduct(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: () => {
          alert('Failed to update product');
        }
      });
    } else {
      this.apiService.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: () => {
          alert('Failed to create product');
        }
      });
    }
  }

  deleteProduct(product: Product): void {
    if (confirm(`Delete product "${product.name}"?`)) {
      this.apiService.deleteProduct(product.id!).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert(err.error?.error || 'Failed to delete product');
        }
      });
    }
  }

  exportToCSV(): void {
    this.apiService.exportProductsCSV().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Failed to export products');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csvData = e.target.result;
        this.importFromCSV(csvData);
      };
      reader.readAsText(file);
    }
  }

  importFromCSV(csvData: string): void {
    if (!confirm('This will import products from the CSV file. Existing products with the same name or barcode will be updated. Continue?')) {
      return;
    }

    this.apiService.importProductsCSV(csvData).subscribe({
      next: (result) => {
        let message = `Import completed!\n\nImported: ${result.imported} of ${result.total} products`;
        
        if (result.errors && result.errors.length > 0) {
          message += `\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            message += `\n... and ${result.errors.length - 5} more errors`;
          }
        }
        
        alert(message);
        this.loadProducts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to import products');
      }
    });
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  downloadSampleCSV(): void {
    const sampleCSV = `ID,Name,Description,Price,Purchase Price,Stock,Category,Barcode
101,Sample Product 1,This is a sample product,99.99,50.00,100,Electronics,1234567890
102,Sample Product 2,Another sample product,149.99,75.00,50,Accessories,0987654321
103,"Product with ""Quotes""",Description with special chars,199.99,100.00,25,Home & Garden,1122334455`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_products.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
