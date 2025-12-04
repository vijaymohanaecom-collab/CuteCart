import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Invoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class PdfInvoiceService {

  constructor() { }

  async generateInvoicePDF(invoice: Invoice, storeSettings?: any): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Store Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(storeSettings?.store_name || 'CuteCart', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (storeSettings?.store_address) {
      doc.text(storeSettings.store_address, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    
    if (storeSettings?.store_phone) {
      doc.text(`Phone: ${storeSettings.store_phone}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    
    if (storeSettings?.store_email) {
      doc.text(`Email: ${storeSettings.store_email}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    
    if (storeSettings?.store_website) {
      doc.text(`Website: ${storeSettings.store_website}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }

    // Line separator
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // Invoice Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoice_number}`, 15, yPos);
    
    const invoiceDate = new Date(invoice.created_at!);
    const formattedDate = invoiceDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Date: ${formattedDate}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 10;

    // Bill To Section
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 15, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer_name || 'Walk-in Customer', 15, yPos);
    yPos += 5;
    
    if (invoice.customer_phone) {
      doc.text(`Phone: ${invoice.customer_phone}`, 15, yPos);
      yPos += 5;
    }
    
    yPos += 5;

    // Items Table Header
    const tableStartY = yPos;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    yPos += 6;
    
    doc.text('ITEM', 20, yPos);
    doc.text('QTY', pageWidth - 80, yPos, { align: 'right' });
    doc.text('PRICE', pageWidth - 55, yPos, { align: 'right' });
    doc.text('TOTAL', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 4;
    doc.setLineWidth(0.1);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 6;

    // Items
    doc.setFont('helvetica', 'normal');
    invoice.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.product_name, 20, yPos);
      doc.text(item.quantity.toString(), pageWidth - 80, yPos, { align: 'right' });
      doc.text(`₹${item.unit_price.toFixed(2)}`, pageWidth - 55, yPos, { align: 'right' });
      doc.text(`₹${item.total_price.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 6;
    });

    // Line before totals
    yPos += 2;
    doc.setLineWidth(0.1);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;

    // Totals Section
    const totalsX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;

    if (invoice.tax_rate > 0) {
      doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, yPos);
      doc.text(`₹${invoice.tax_amount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 6;
    }

    if (invoice.discount && invoice.discount > 0) {
      doc.text('Discount:', totalsX, yPos);
      doc.text(`-₹${invoice.discount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 6;
    }

    // Grand Total
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, yPos, pageWidth - 15, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(`₹${invoice.total.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 8;

    // Payment Method
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${invoice.payment_method?.toUpperCase() || 'CASH'}`, 15, yPos);
    yPos += 10;

    // Footer
    if (storeSettings?.invoice_footer) {
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(storeSettings.invoice_footer, pageWidth / 2, yPos, { align: 'center' });
    }

    // Convert to Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async shareViaWhatsApp(invoice: Invoice, storeSettings?: any): Promise<void> {
    if (!invoice.customer_phone) {
      throw new Error('Customer phone number is not available');
    }

    // Generate PDF
    const pdfBlob = await this.generateInvoicePDF(invoice, storeSettings);
    
    // Clean phone number
    let phoneNumber = invoice.customer_phone.replace(/[^0-9]/g, '');
    
    // Add country code if not present (assuming India +91)
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create message
    const message = `Hi ${invoice.customer_name || 'Customer'},\n\nThank you for your purchase!\n\nInvoice #${invoice.invoice_number}\nTotal: ₹${invoice.total.toFixed(2)}\n\nPlease find your invoice attached.\n\nThank you for your business! 🙏\n\n- CuteCart`;
    
    const encodedMessage = encodeURIComponent(message);
    
    // For mobile devices, try to use the share API with the PDF
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        const file = new File([pdfBlob], `Invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: `Invoice ${invoice.invoice_number}`,
          text: message,
          files: [file]
        });
        return;
      } catch (err) {
        console.log('Share API failed, falling back to WhatsApp Web');
      }
    }
    
    // Fallback: Download PDF and open WhatsApp with message
    this.downloadPDF(pdfBlob, `Invoice-${invoice.invoice_number}.pdf`);
    
    // Open WhatsApp with message (PDF needs to be manually attached)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Show instruction to user
    setTimeout(() => {
      alert('PDF downloaded! Please attach it manually in WhatsApp.');
    }, 500);
  }
}
