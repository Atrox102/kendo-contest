import type { NewProduct, NewProductTax, NewInvoice, NewInvoiceItem, NewInvoiceItemTax, NewReceipt, NewReceiptItem, NewReceiptItemTax } from '../database/schema';

// Realistic business data
const PRODUCT_CATEGORIES = {
  'Software Development': [
    'Custom Web Application Development',
    'Mobile App Development (iOS/Android)',
    'E-commerce Platform Setup',
    'API Development & Integration',
    'Database Design & Optimization',
    'Cloud Migration Services',
    'DevOps & CI/CD Setup',
    'Software Maintenance & Support',
    'Code Review & Audit',
    'Technical Consulting'
  ],
  'Digital Marketing': [
    'SEO Optimization Package',
    'Google Ads Campaign Management',
    'Social Media Marketing',
    'Content Creation & Strategy',
    'Email Marketing Automation',
    'Brand Identity Design',
    'Website Analytics Setup',
    'Conversion Rate Optimization',
    'Influencer Marketing Campaign',
    'Digital Marketing Audit'
  ],
  'Business Consulting': [
    'Business Strategy Consultation',
    'Market Research & Analysis',
    'Financial Planning & Forecasting',
    'Process Optimization',
    'Change Management',
    'Risk Assessment',
    'Compliance Audit',
    'Training & Development',
    'Project Management',
    'Quality Assurance Consulting'
  ],
  'Creative Services': [
    'Logo & Brand Design',
    'Website UI/UX Design',
    'Print Design Services',
    'Video Production',
    'Photography Services',
    'Copywriting & Content',
    'Graphic Design Package',
    'Animation Services',
    'Packaging Design',
    'Marketing Materials Design'
  ]
};

const COMPANIES = [
  'TechCorp Solutions', 'Digital Dynamics LLC', 'Innovation Partners', 'Global Systems Inc',
  'NextGen Technologies', 'Smart Business Solutions', 'Creative Minds Agency', 'Data Driven Co',
  'Cloud First Enterprises', 'Agile Development Group', 'Strategic Consulting Firm', 'Modern Marketing Hub',
  'Enterprise Solutions Ltd', 'Digital Transformation Co', 'Business Intelligence Corp', 'Future Tech Ventures',
  'Scalable Systems Inc', 'Customer Success Partners', 'Growth Accelerator LLC', 'Innovative Designs Studio'
];

const INDIVIDUAL_CLIENTS = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'William Garcia', 'Jessica Rodriguez',
  'Christopher Lee', 'Amanda White', 'Matthew Harris', 'Ashley Clark', 'Daniel Lewis',
  'Stephanie Walker', 'Kevin Hall', 'Michelle Young', 'Brian King', 'Nicole Wright'
];

const ADDRESSES = [
  '123 Business Ave, New York, NY 10001',
  '456 Corporate Blvd, Los Angeles, CA 90210',
  '789 Enterprise St, Chicago, IL 60601',
  '321 Innovation Dr, Austin, TX 78701',
  '654 Technology Ln, Seattle, WA 98101',
  '987 Commerce Way, Miami, FL 33101',
  '147 Industry Rd, Boston, MA 02101',
  '258 Professional Ct, Denver, CO 80201',
  '369 Executive Plaza, Atlanta, GA 30301',
  '741 Strategic Ave, San Francisco, CA 94101'
];

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'check'];
const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];

// Tax configurations for different regions
const TAX_CONFIGS = [
  { name: 'VAT', rate: 20 },
  { name: 'Sales Tax', rate: 8.5 },
  { name: 'GST', rate: 15 },
  { name: 'Service Tax', rate: 12 },
  { name: 'State Tax', rate: 6.5 },
  { name: 'City Tax', rate: 2.5 }
];

// Utility functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateDate(daysBack: number = 365): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString().split('T')[0];
}

function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const number = randomInt(1000, 9999);
  return `${prefix}-${year}-${number}`;
}

function generateReceiptNumber(): string {
  const prefix = 'RCP';
  const year = new Date().getFullYear();
  const number = randomInt(10000, 99999);
  return `${prefix}-${year}-${number}`;
}

// Data generators
export function generateProducts(count: number = 15): { products: NewProduct[], productTaxes: NewProductTax[] } {
  const products: NewProduct[] = [];
  const productTaxes: NewProductTax[] = [];
  let productId = 1;

  for (const [category, items] of Object.entries(PRODUCT_CATEGORIES)) {
    const itemsToGenerate = Math.ceil(count / Object.keys(PRODUCT_CATEGORIES).length);
    
    for (let i = 0; i < itemsToGenerate && products.length < count; i++) {
      const productName = randomChoice(items);
      const basePrice = randomFloat(500, 5000);
      
      const product: NewProduct = {
        name: productName,
        description: `Professional ${productName.toLowerCase()} service with comprehensive support and documentation. Includes consultation, implementation, and follow-up support.`,
        defaultPrice: basePrice
      };
      
      products.push(product);
      
      // Add 1-3 taxes per product
      const taxCount = randomInt(1, 3);
      for (let j = 0; j < taxCount; j++) {
        const tax = randomChoice(TAX_CONFIGS);
        productTaxes.push({
          productId: productId,
          taxName: tax.name,
          taxRate: tax.rate,
          isDefault: j === 0 // First tax is default
        });
      }
      
      productId++;
    }
  }

  return { products, productTaxes };
}

export function generateInvoices(count: number = 12, productIds: number[]): {
  invoices: NewInvoice[],
  invoiceItems: NewInvoiceItem[],
  invoiceItemTaxes: NewInvoiceItemTax[]
} {
  const invoices: NewInvoice[] = [];
  const invoiceItems: NewInvoiceItem[] = [];
  const invoiceItemTaxes: NewInvoiceItemTax[] = [];
  
  for (let i = 0; i < count; i++) {
    const issueDate = generateDate(180);
    const dueDateObj = new Date(issueDate);
    dueDateObj.setDate(dueDateObj.getDate() + randomInt(15, 60));
    const dueDate = dueDateObj.toISOString().split('T')[0];
    
    const clientName = randomChoice(COMPANIES);
    const issuerName = 'Your Business Name LLC';
    
    let subtotal = 0;
    let totalTax = 0;
    
    const invoice: NewInvoice = {
      invoiceNumber: generateInvoiceNumber(),
      issuerName,
      issuerAddress: randomChoice(ADDRESSES),
      issuerTaxId: `TAX-${randomInt(100000, 999999)}`,
      clientName,
      clientAddress: randomChoice(ADDRESSES),
      clientTaxId: `CLI-${randomInt(100000, 999999)}`,
      issueDate,
      dueDate,
      subtotal: 0, // Will be calculated
      totalTax: 0, // Will be calculated
      total: 0, // Will be calculated
      notes: randomChoice([
        'Payment terms: Net 30 days',
        'Thank you for your business!',
        'Please remit payment by due date',
        'Contact us for any questions',
        ''
      ]),
      status: randomChoice(INVOICE_STATUSES)
    };
    
    invoices.push(invoice);
    const invoiceId = i + 1;
    
    // Generate 1-5 line items per invoice
    const itemCount = randomInt(1, 5);
    for (let j = 0; j < itemCount; j++) {
      const productId = randomChoice(productIds);
      const quantity = randomFloat(1, 10, 1);
      const unitPrice = randomFloat(200, 2000);
      const lineSubtotal = quantity * unitPrice;
      
      // Generate taxes for this line item
      const taxCount = randomInt(1, 2);
      let lineTaxTotal = 0;
      
      for (let k = 0; k < taxCount; k++) {
        const tax = randomChoice(TAX_CONFIGS);
        const taxAmount = (lineSubtotal * tax.rate) / 100;
        lineTaxTotal += taxAmount;
        
        invoiceItemTaxes.push({
          invoiceItemId: invoiceItems.length + 1,
          taxName: tax.name,
          taxRate: tax.rate,
          taxAmount
        });
      }
      
      const lineTotal = lineSubtotal + lineTaxTotal;
      
      invoiceItems.push({
        invoiceId,
        productId,
        productName: `Professional Service ${j + 1}`,
        description: 'Comprehensive professional service delivery',
        quantity,
        unitPrice,
        lineTotal
      });
      
      subtotal += lineSubtotal;
      totalTax += lineTaxTotal;
    }
    
    // Update invoice totals
    invoice.subtotal = subtotal;
    invoice.totalTax = totalTax;
    invoice.total = subtotal + totalTax;
  }
  
  return { invoices, invoiceItems, invoiceItemTaxes };
}

export function generateReceipts(count: number = 15, productIds: number[]): {
  receipts: NewReceipt[],
  receiptItems: NewReceiptItem[],
  receiptItemTaxes: NewReceiptItemTax[]
} {
  const receipts: NewReceipt[] = [];
  const receiptItems: NewReceiptItem[] = [];
  const receiptItemTaxes: NewReceiptItemTax[] = [];
  
  for (let i = 0; i < count; i++) {
    const issueDate = generateDate(90);
    const issuerName = 'Your Business Name LLC';
    
    let subtotal = 0;
    let totalTax = 0;
    
    const receipt: NewReceipt = {
      receiptNumber: generateReceiptNumber(),
      issuerName,
      issuerAddress: randomChoice(ADDRESSES),
      issueDate,
      subtotal: 0, // Will be calculated
      totalTax: 0, // Will be calculated
      total: 0, // Will be calculated
      paymentMethod: randomChoice(PAYMENT_METHODS),
      notes: randomChoice([
        'Thank you for your purchase!',
        'Items are non-refundable',
        'Warranty included',
        'Customer satisfaction guaranteed',
        ''
      ])
    };
    
    receipts.push(receipt);
    const receiptId = i + 1;
    
    // Generate 1-4 line items per receipt
    const itemCount = randomInt(1, 4);
    for (let j = 0; j < itemCount; j++) {
      const productId = randomChoice(productIds);
      const quantity = randomFloat(1, 5, 1);
      const unitPrice = randomFloat(50, 500);
      const lineSubtotal = quantity * unitPrice;
      
      // Generate taxes for this line item
      const taxCount = randomInt(1, 2);
      let lineTaxTotal = 0;
      
      for (let k = 0; k < taxCount; k++) {
        const tax = randomChoice(TAX_CONFIGS);
        const taxAmount = (lineSubtotal * tax.rate) / 100;
        lineTaxTotal += taxAmount;
        
        receiptItemTaxes.push({
          receiptItemId: receiptItems.length + 1,
          taxName: tax.name,
          taxRate: tax.rate,
          taxAmount
        });
      }
      
      const lineTotal = lineSubtotal + lineTaxTotal;
      
      receiptItems.push({
        receiptId,
        productId,
        productName: `Product/Service ${j + 1}`,
        description: 'Quality product with excellent value',
        quantity,
        unitPrice,
        lineTotal
      });
      
      subtotal += lineSubtotal;
      totalTax += lineTaxTotal;
    }
    
    // Update receipt totals
    receipt.subtotal = subtotal;
    receipt.totalTax = totalTax;
    receipt.total = subtotal + totalTax;
  }
  
  return { receipts, receiptItems, receiptItemTaxes };
}