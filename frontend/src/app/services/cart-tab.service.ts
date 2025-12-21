import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartTab, CartTabState } from '../models/cart-tab.model';
import { InvoiceItem } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class CartTabService {
  private readonly STORAGE_KEY = 'cute-cart-tabs';
  private stateSubject = new BehaviorSubject<CartTabState>({
    tabs: [],
    activeTabId: null
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as CartTabState;
        // Convert date strings back to Date objects
        state.tabs = state.tabs.map(tab => ({
          ...tab,
          createdAt: new Date(tab.createdAt),
          updatedAt: new Date(tab.updatedAt)
        }));
        this.stateSubject.next(state);
      }
    } catch (error) {
      console.error('Error loading cart tabs from storage:', error);
      // Initialize with default tab if storage fails
      this.createNewTab();
    }
  }

  private saveToStorage(state: CartTabState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart tabs to storage:', error);
    }
  }

  private updateState(updates: Partial<CartTabState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
    this.saveToStorage(newState);
  }

  getState(): Observable<CartTabState> {
    return this.stateSubject.asObservable();
  }

  getCurrentState(): CartTabState {
    return this.stateSubject.value;
  }

  createNewTab(name?: string): CartTab {
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const tabName = name || `Cart ${this.stateSubject.value.tabs.length + 1}`;
    
    const newTab: CartTab = {
      id: tabId,
      name: tabName,
      items: [],
      customerName: '',
      customerPhone: '',
      paymentMethod: 'cash',
      notes: '',
      discount: 0,
      discountType: 'fixed',
      discountPercentage: 0,
      isPartialPayment: false,
      cashAmount: 0,
      upiAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentState = this.stateSubject.value;
    this.updateState({
      tabs: [...currentState.tabs, newTab],
      activeTabId: tabId
    });

    return newTab;
  }

  getActiveTab(): CartTab | null {
    const state = this.stateSubject.value;
    if (!state.activeTabId) return null;
    return state.tabs.find(tab => tab.id === state.activeTabId) || null;
  }

  switchToTab(tabId: string): void {
    const state = this.stateSubject.value;
    if (state.tabs.find(tab => tab.id === tabId)) {
      this.updateState({ activeTabId: tabId });
    }
  }

  updateActiveTab(updates: Partial<CartTab>): void {
    const state = this.stateSubject.value;
    if (!state.activeTabId) return;

    const tabIndex = state.tabs.findIndex(tab => tab.id === state.activeTabId);
    if (tabIndex === -1) return;

    const updatedTabs = [...state.tabs];
    updatedTabs[tabIndex] = {
      ...updatedTabs[tabIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.updateState({ tabs: updatedTabs });
  }

  addItemToActiveTab(product: any): void {
    const activeTab = this.getActiveTab();
    if (!activeTab) {
      this.createNewTab();
      return this.addItemToActiveTab(product);
    }

    const existing = activeTab.items.find(item => item.product_id === product.id);
    let updatedItems: InvoiceItem[];

    if (existing) {
      updatedItems = activeTab.items.map(item => 
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      );
    } else {
      const newItem: InvoiceItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        purchase_price: product.purchase_price || 0
      };
      updatedItems = [...activeTab.items, newItem];
    }

    this.updateActiveTab({ items: updatedItems });
  }

  updateItemQuantityInActiveTab(productId: string | number, quantity: number): void {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    if (quantity <= 0) {
      this.removeItemFromActiveTab(productId);
    } else {
      const updatedItems = activeTab.items.map(item => 
        item.product_id === productId
          ? { ...item, quantity, total_price: quantity * item.unit_price }
          : item
      );
      this.updateActiveTab({ items: updatedItems });
    }
  }

  removeItemFromActiveTab(productId: string | number): void {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    const updatedItems = activeTab.items.filter(item => item.product_id !== productId);
    this.updateActiveTab({ items: updatedItems });
  }

  clearActiveTab(): void {
    this.updateActiveTab({
      items: [],
      customerName: '',
      customerPhone: '',
      notes: '',
      discount: 0,
      discountPercentage: 0,
      discountType: 'fixed',
      paymentMethod: 'cash',
      isPartialPayment: false,
      cashAmount: 0,
      upiAmount: 0
    });
  }

  deleteTab(tabId: string): void {
    const state = this.stateSubject.value;
    const updatedTabs = state.tabs.filter(tab => tab.id !== tabId);
    
    if (updatedTabs.length === 0) {
      // Create a new default tab if all tabs are deleted
      this.createNewTab();
    } else if (state.activeTabId === tabId) {
      // Switch to the first available tab if the active tab is deleted
      this.updateState({
        tabs: updatedTabs,
        activeTabId: updatedTabs[0].id
      });
    } else {
      this.updateState({ tabs: updatedTabs });
    }
  }

  updateTabName(tabId: string, name: string): void {
    const state = this.stateSubject.value;
    const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const updatedTabs = [...state.tabs];
    updatedTabs[tabIndex] = {
      ...updatedTabs[tabIndex],
      name,
      updatedAt: new Date()
    };

    this.updateState({ tabs: updatedTabs });
  }

  updateTabEditingState(tabId: string, isEditing: boolean): void {
    const state = this.stateSubject.value;
    const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const updatedTabs = [...state.tabs];
    updatedTabs[tabIndex] = {
      ...updatedTabs[tabIndex],
      isEditing
    };

    this.updateState({ tabs: updatedTabs });
  }

  calculateTabTotals(tab: CartTab): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = tab.items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = (subtotal * 0) / 100; // Tax rate will be applied from settings
    const discount = tab.discountType === 'percentage' 
      ? (subtotal * tab.discountPercentage) / 100 
      : tab.discount;
    const total = subtotal + taxAmount - discount;

    return { subtotal, taxAmount, total };
  }

  clearAllTabs(): void {
    this.updateState({ tabs: [], activeTabId: null });
    this.createNewTab();
  }
}
