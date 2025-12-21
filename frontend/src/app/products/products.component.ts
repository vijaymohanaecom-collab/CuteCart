import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';
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
  filteredProducts: Product[] = [];
  showModal = false;
  editMode = false;
  currentProduct: Product = this.getEmptyProduct();
  
  showStockModal = false;
  showStockHistoryModal = false;
  stockProduct: Product | null = null;
  stockQuantity: number = 0;
  stockPurchasePrice: number = 0;
  stockSalePrice: number = 0;
  stockNotes: string = '';
  stockHistory: any[] = [];
  stockSummary: any = null;
  
  // Search and filter properties
  searchTerm = '';
  selectedCategory = '';
  showLowStockOnly = false;
  lowStockThreshold = 10; // Will be updated from settings
  
  // Category management (simplified)
  
  // Statistics
  stats = {
    totalProducts: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    categories: [] as string[]
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    // Load low stock threshold from settings
    this.lowStockThreshold = this.settingsService.getLowStockThreshold();
    
    // Subscribe to settings changes
    this.settingsService.settings$.subscribe(settings => {
      if (settings) {
        this.lowStockThreshold = settings.low_stock_threshold || 10;
        // Recalculate statistics when settings change
        if (this.products.length > 0) {
          this.calculateStatistics();
          this.applyFilters();
        }
      }
    });
    
    this.loadProducts();
  }

  loadProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.calculateStatistics();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  calculateStatistics(): void {
    this.stats.totalProducts = this.products.length;
    
    // Calculate inventory value (price * stock)
    this.stats.inventoryValue = this.products.reduce((sum, product) => {
      return sum + (product.price * (product.stock || 0));
    }, 0);
    
    // Count low stock items
    this.stats.lowStockCount = this.products.filter(p => 
      (p.stock || 0) < this.lowStockThreshold
    ).length;
    
    // Get unique categories
    const categorySet = new Set<string>();
    this.products.forEach(p => {
      if (p.category && p.category.trim()) {
        categorySet.add(p.category.trim());
      }
    });
    this.stats.categories = Array.from(categorySet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.products];
    
    // Search by ID or Name
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.id?.toString().toLowerCase().includes(term))
      );
    }
    
    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    
    // Filter low stock items
    if (this.showLowStockOnly) {
      filtered = filtered.filter(p => (p.stock || 0) < this.lowStockThreshold);
    }
    
    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onLowStockToggle(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.showLowStockOnly = false;
    this.applyFilters();
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

  onPurchasePriceChange(): void {
    // Auto-calculate selling price with 40% margin
    if (this.currentProduct.purchase_price && this.currentProduct.purchase_price > 0) {
      this.currentProduct.price = this.currentProduct.purchase_price * 1.4;
    }
  }

  onStockPurchasePriceChange(): void {
    // Auto-calculate selling price with 40% margin if sale price is not set
    if (this.stockPurchasePrice > 0 && this.stockSalePrice === 0) {
      this.stockSalePrice = this.stockPurchasePrice * 1.4;
    }
  }

  openAddStockModal(product: Product): void {
    this.stockProduct = { ...product };
    this.stockQuantity = 0;
    this.stockPurchasePrice = product.purchase_price || 0;
    this.stockSalePrice = product.price || 0;
    this.stockNotes = '';
    this.showStockModal = true;
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.stockProduct = null;
    this.stockQuantity = 0;
    this.stockPurchasePrice = 0;
    this.stockSalePrice = 0;
    this.stockNotes = '';
  }

  addStock(): void {
    if (!this.stockProduct || !this.stockProduct.id) return;

    if (this.stockQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (this.stockPurchasePrice < 0) {
      alert('Purchase price cannot be negative');
      return;
    }

    if (this.stockSalePrice < 0) {
      alert('Sale price cannot be negative');
      return;
    }

    const stockData = {
      quantity: this.stockQuantity,
      purchase_price: this.stockPurchasePrice,
      sale_price: this.stockSalePrice,
      notes: this.stockNotes,
      added_by: 'user'
    };

    this.apiService.addStock(this.stockProduct.id, stockData).subscribe({
      next: (response) => {
        const msg = `Stock added successfully!\n\n` +
          `Quantity Added: ${response.stockAdded}\n` +
          `New Stock: ${response.newStock}\n` +
          `Avg Purchase Price: ₹${response.newAvgPurchasePrice.toFixed(2)}\n` +
          `Sale Price: ₹${response.newSalePrice.toFixed(2)}\n` +
          `Profit/Unit: ₹${response.profitPerUnit.toFixed(2)} (${response.profitMarginPercent.toFixed(2)}%)`;
        
        alert(msg);
        this.loadProducts();
        this.closeStockModal();
      },
      error: (err) => {
        console.error('Error adding stock:', err);
        alert(err.error?.error || 'Failed to add stock');
      }
    });
  }

  openStockHistoryModal(product: Product): void {
    if (!product.id) return;
    
    this.stockProduct = { ...product };
    this.showStockHistoryModal = true;
    
    this.apiService.getStockHistory(product.id, 20).subscribe({
      next: (history) => {
        this.stockHistory = history;
      },
      error: (err) => console.error('Error loading stock history:', err)
    });

    this.apiService.getStockSummary(product.id).subscribe({
      next: (summary) => {
        this.stockSummary = summary;
      },
      error: (err) => console.error('Error loading stock summary:', err)
    });
  }

  closeStockHistoryModal(): void {
    this.showStockHistoryModal = false;
    this.stockProduct = null;
    this.stockHistory = [];
    this.stockSummary = null;
  }

  deleteCategory(categoryName: string): void {
    if (!categoryName) return;
    
    const productsWithCategory = this.products.filter(p => p.category === categoryName);
    
    if (productsWithCategory.length > 0) {
      const confirmMsg = `This category is used by ${productsWithCategory.length} product(s). Deleting it will remove the category from all these products. Continue?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    } else {
      if (!confirm(`Delete category "${categoryName}"?`)) {
        return;
      }
    }
    
    // Update all products with this category to have no category
    const updatePromises = productsWithCategory.map(product => {
      const updatedProduct = { ...product, category: '' };
      return this.apiService.updateProduct(product.id!, updatedProduct).toPromise();
    });
    
    Promise.all(updatePromises).then(() => {
      this.currentProduct.category = '';
      this.loadProducts();
      alert(`Category "${categoryName}" deleted successfully.`);
    }).catch(err => {
      console.error('Error deleting category:', err);
      alert('Failed to delete category. Please try again.');
    });
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
