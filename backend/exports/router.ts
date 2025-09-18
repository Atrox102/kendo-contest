import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { invoices, invoiceItems, receipts, receiptItems, type InvoiceItem } from "../../database/schema";
import { eq } from "drizzle-orm";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export const exportsRouter = router({
  // Export invoice as PDF
  exportInvoicePDF: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get invoice with items
      const invoice = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice[0]) {
        throw new Error("Invoice not found");
      }

      const items = await ctx.db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.id));

      // Create PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("INVOICE", 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice[0].invoiceNumber}`, 20, 45);
      doc.text(`Date: ${invoice[0].issueDate}`, 20, 55);
      if (invoice[0].dueDate) {
        doc.text(`Due Date: ${invoice[0].dueDate}`, 20, 65);
      }

      // Issuer details
      doc.setFontSize(14);
      doc.text("From:", 20, 85);
      doc.setFontSize(10);
      doc.text(invoice[0].issuerName, 20, 95);
      if (invoice[0].issuerAddress) doc.text(invoice[0].issuerAddress, 20, 105);
      if (invoice[0].issuerEmail) doc.text(invoice[0].issuerEmail, 20, 115);
      if (invoice[0].issuerPhone) doc.text(invoice[0].issuerPhone, 20, 125);

      // Client details
      doc.setFontSize(14);
      doc.text("To:", 120, 85);
      doc.setFontSize(10);
      doc.text(invoice[0].clientName, 120, 95);
      if (invoice[0].clientAddress) doc.text(invoice[0].clientAddress, 120, 105);
      if (invoice[0].clientEmail) doc.text(invoice[0].clientEmail, 120, 115);
      if (invoice[0].clientPhone) doc.text(invoice[0].clientPhone, 120, 125);

      // Items table
      let yPos = 150;
      doc.setFontSize(12);
      doc.text("Description", 20, yPos);
      doc.text("Qty", 120, yPos);
      doc.text("Price", 140, yPos);
      doc.text("Tax", 160, yPos);
      doc.text("Total", 180, yPos);
      
      yPos += 10;
      doc.line(20, yPos, 200, yPos);
      yPos += 10;

      doc.setFontSize(10);
      items.forEach((item: InvoiceItem) => {
        doc.text(item.productName, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPos);
        doc.text(`$${item.taxAmount.toFixed(2)}`, 160, yPos);
        doc.text(`$${item.lineTotal.toFixed(2)}`, 180, yPos);
        yPos += 10;
      });

      // Totals
      yPos += 10;
      doc.line(20, yPos, 200, yPos);
      yPos += 10;
      doc.text(`Subtotal: $${invoice[0].subtotal.toFixed(2)}`, 140, yPos);
      yPos += 10;
      doc.text(`Tax: $${invoice[0].totalTax.toFixed(2)}`, 140, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Total: $${invoice[0].total.toFixed(2)}`, 140, yPos);

      // Notes
      if (invoice[0].notes) {
        yPos += 20;
        doc.setFontSize(10);
        doc.text("Notes:", 20, yPos);
        yPos += 10;
        doc.text(invoice[0].notes, 20, yPos);
      }

      const pdfBuffer = doc.output('arraybuffer');
      const base64 = Buffer.from(pdfBuffer).toString('base64');
      
      return {
        filename: `invoice-${invoice[0].invoiceNumber}.pdf`,
        data: base64,
        mimeType: 'application/pdf'
      };
    }),

  // Export receipt as PDF
  exportReceiptPDF: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get receipt with items
      const receipt = await ctx.db
        .select()
        .from(receipts)
        .where(eq(receipts.id, input.id))
        .limit(1);

      if (!receipt[0]) {
        throw new Error("Receipt not found");
      }

      const items = await ctx.db
        .select()
        .from(receiptItems)
        .where(eq(receiptItems.receiptId, input.id));

      // Create PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("RECEIPT", 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Receipt #: ${receipt[0].receiptNumber}`, 20, 45);
      doc.text(`Date: ${receipt[0].issueDate}`, 20, 55);
      doc.text(`Payment: ${receipt[0].paymentMethod}`, 20, 65);

      // Issuer details
      doc.setFontSize(14);
      doc.text("From:", 20, 85);
      doc.setFontSize(10);
      doc.text(receipt[0].issuerName, 20, 95);
      if (receipt[0].issuerAddress) doc.text(receipt[0].issuerAddress, 20, 105);
      if (receipt[0].issuerEmail) doc.text(receipt[0].issuerEmail, 20, 115);
      if (receipt[0].issuerPhone) doc.text(receipt[0].issuerPhone, 20, 125);

      // Items table
      let yPos = 150;
      doc.setFontSize(12);
      doc.text("Description", 20, yPos);
      doc.text("Qty", 120, yPos);
      doc.text("Price", 140, yPos);
      doc.text("Tax", 160, yPos);
      doc.text("Total", 180, yPos);
      
      yPos += 10;
      doc.line(20, yPos, 200, yPos);
      yPos += 10;

      doc.setFontSize(10);
      items.forEach((item) => {
        doc.text(item.productName, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPos);
        doc.text(`$${item.taxAmount.toFixed(2)}`, 160, yPos);
        doc.text(`$${item.lineTotal.toFixed(2)}`, 180, yPos);
        yPos += 10;
      });

      // Totals
      yPos += 10;
      doc.line(20, yPos, 200, yPos);
      yPos += 10;
      doc.text(`Subtotal: $${receipt[0].subtotal.toFixed(2)}`, 140, yPos);
      yPos += 10;
      doc.text(`Tax: $${receipt[0].totalTax.toFixed(2)}`, 140, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Total: $${receipt[0].total.toFixed(2)}`, 140, yPos);

      // Notes
      if (receipt[0].notes) {
        yPos += 20;
        doc.setFontSize(10);
        doc.text("Notes:", 20, yPos);
        yPos += 10;
        doc.text(receipt[0].notes, 20, yPos);
      }

      const pdfBuffer = doc.output('arraybuffer');
      const base64 = Buffer.from(pdfBuffer).toString('base64');
      
      return {
        filename: `receipt-${receipt[0].receiptNumber}.pdf`,
        data: base64,
        mimeType: 'application/pdf'
      };
    }),

  // Export invoice as Excel
  exportInvoiceExcel: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get invoice with items
      const invoice = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice[0]) {
        throw new Error("Invoice not found");
      }

      const items = await ctx.db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.id));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Invoice details sheet
      const invoiceData = [
        ["Invoice Number", invoice[0].invoiceNumber],
        ["Issue Date", invoice[0].issueDate],
        ["Due Date", invoice[0].dueDate || ""],
        ["Status", invoice[0].status],
        [""],
        ["Issuer Name", invoice[0].issuerName],
        ["Issuer Address", invoice[0].issuerAddress || ""],
        ["Issuer Email", invoice[0].issuerEmail || ""],
        ["Issuer Phone", invoice[0].issuerPhone || ""],
        [""],
        ["Client Name", invoice[0].clientName],
        ["Client Address", invoice[0].clientAddress || ""],
        ["Client Email", invoice[0].clientEmail || ""],
        ["Client Phone", invoice[0].clientPhone || ""],
        [""],
        ["Subtotal", invoice[0].subtotal],
        ["Total Tax", invoice[0].totalTax],
        ["Total", invoice[0].total],
        [""],
        ["Notes", invoice[0].notes || ""],
      ];

      const invoiceWS = XLSX.utils.aoa_to_sheet(invoiceData);
      XLSX.utils.book_append_sheet(wb, invoiceWS, "Invoice Details");

      // Items sheet
      const itemsData = [
        ["Product Name", "Description", "Quantity", "Unit Price", "Tax Rate", "Tax Amount", "Line Total"],
        ...items.map(item => [
          item.productName,
          item.description || "",
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.taxAmount,
          item.lineTotal
        ])
      ];

      const itemsWS = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, itemsWS, "Line Items");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');

      return {
        filename: `invoice-${invoice[0].invoiceNumber}.xlsx`,
        data: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }),

  // Export receipt as Excel
  exportReceiptExcel: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get receipt with items
      const receipt = await ctx.db
        .select()
        .from(receipts)
        .where(eq(receipts.id, input.id))
        .limit(1);

      if (!receipt[0]) {
        throw new Error("Receipt not found");
      }

      const items = await ctx.db
        .select()
        .from(receiptItems)
        .where(eq(receiptItems.receiptId, input.id));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Receipt details sheet
      const receiptData = [
        ["Receipt Number", receipt[0].receiptNumber],
        ["Issue Date", receipt[0].issueDate],
        ["Payment Method", receipt[0].paymentMethod],
        [""],
        ["Issuer Name", receipt[0].issuerName],
        ["Issuer Address", receipt[0].issuerAddress || ""],
        ["Issuer Email", receipt[0].issuerEmail || ""],
        ["Issuer Phone", receipt[0].issuerPhone || ""],
        [""],
        ["Subtotal", receipt[0].subtotal],
        ["Total Tax", receipt[0].totalTax],
        ["Total", receipt[0].total],
        [""],
        ["Notes", receipt[0].notes || ""],
      ];

      const receiptWS = XLSX.utils.aoa_to_sheet(receiptData);
      XLSX.utils.book_append_sheet(wb, receiptWS, "Receipt Details");

      // Items sheet
      const itemsData = [
        ["Product Name", "Description", "Quantity", "Unit Price", "Tax Rate", "Tax Amount", "Line Total"],
        ...items.map(item => [
          item.productName,
          item.description || "",
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.taxAmount,
          item.lineTotal
        ])
      ];

      const itemsWS = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, itemsWS, "Line Items");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');

      return {
        filename: `receipt-${receipt[0].receiptNumber}.xlsx`,
        data: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }),
});