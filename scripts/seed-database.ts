import { db, initializeDatabase, closeDatabase } from '../database/db';
import { 
  products, 
  productTaxes, 
  invoices, 
  invoiceItems, 
  invoiceItemTaxes,
  receipts,
  receiptItems,
  receiptItemTaxes
} from '../database/schema';
import { generateProducts, generateInvoices, generateReceipts } from './data-generators';

// Configuration
const SEED_CONFIG = {
  products: 15,
  invoices: 12,
  receipts: 15
};

async function wipeDatabase() {
  console.log('🗑️  Wiping existing data...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    await db.delete(receiptItemTaxes);
    await db.delete(receiptItems);
    await db.delete(receipts);
    
    await db.delete(invoiceItemTaxes);
    await db.delete(invoiceItems);
    await db.delete(invoices);
    
    await db.delete(productTaxes);
    await db.delete(products);
    
    console.log('✅ Database wiped successfully');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
    throw error;
  }
}

async function seedProducts() {
  console.log(`📦 Seeding ${SEED_CONFIG.products} products...`);
  
  try {
    const { products: productData, productTaxes: productTaxData } = generateProducts(SEED_CONFIG.products);
    
    // Insert products
    const insertedProducts = await db.insert(products).values(productData).returning();
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    
    // Update product taxes with correct IDs
    const updatedProductTaxes = productTaxData.map((tax, index) => ({
      ...tax,
      productId: insertedProducts[Math.floor(index / 2)]?.id || insertedProducts[0].id
    }));
    
    // Insert product taxes
    if (updatedProductTaxes.length > 0) {
      await db.insert(productTaxes).values(updatedProductTaxes);
      console.log(`✅ Inserted ${updatedProductTaxes.length} product taxes`);
    }
    
    return insertedProducts.map(p => p.id);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

async function seedInvoices(productIds: number[]) {
  console.log(`📄 Seeding ${SEED_CONFIG.invoices} invoices...`);
  
  try {
    const { 
      invoices: invoiceData, 
      invoiceItems: invoiceItemData, 
      invoiceItemTaxes: invoiceItemTaxData 
    } = generateInvoices(SEED_CONFIG.invoices, productIds);
    
    // Insert invoices
    const insertedInvoices = await db.insert(invoices).values(invoiceData).returning();
    console.log(`✅ Inserted ${insertedInvoices.length} invoices`);
    
    // Update invoice items with correct invoice IDs
    const updatedInvoiceItems = invoiceItemData.map((item, index) => ({
      ...item,
      invoiceId: insertedInvoices[item.invoiceId - 1]?.id || insertedInvoices[0].id
    }));
    
    // Insert invoice items
    if (updatedInvoiceItems.length > 0) {
      const insertedInvoiceItems = await db.insert(invoiceItems).values(updatedInvoiceItems).returning();
      console.log(`✅ Inserted ${insertedInvoiceItems.length} invoice items`);
      
      // Update invoice item taxes with correct item IDs
      const updatedInvoiceItemTaxes = invoiceItemTaxData.map((tax, index) => ({
        ...tax,
        invoiceItemId: insertedInvoiceItems[Math.floor(index / 2)]?.id || insertedInvoiceItems[0].id
      }));
      
      // Insert invoice item taxes
      if (updatedInvoiceItemTaxes.length > 0) {
        await db.insert(invoiceItemTaxes).values(updatedInvoiceItemTaxes);
        console.log(`✅ Inserted ${updatedInvoiceItemTaxes.length} invoice item taxes`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding invoices:', error);
    throw error;
  }
}

async function seedReceipts(productIds: number[]) {
  console.log(`🧾 Seeding ${SEED_CONFIG.receipts} receipts...`);
  
  try {
    const { 
      receipts: receiptData, 
      receiptItems: receiptItemData, 
      receiptItemTaxes: receiptItemTaxData 
    } = generateReceipts(SEED_CONFIG.receipts, productIds);
    
    // Insert receipts
    const insertedReceipts = await db.insert(receipts).values(receiptData).returning();
    console.log(`✅ Inserted ${insertedReceipts.length} receipts`);
    
    // Update receipt items with correct receipt IDs
    const updatedReceiptItems = receiptItemData.map((item, index) => ({
      ...item,
      receiptId: insertedReceipts[item.receiptId - 1]?.id || insertedReceipts[0].id
    }));
    
    // Insert receipt items
    if (updatedReceiptItems.length > 0) {
      const insertedReceiptItems = await db.insert(receiptItems).values(updatedReceiptItems).returning();
      console.log(`✅ Inserted ${insertedReceiptItems.length} receipt items`);
      
      // Update receipt item taxes with correct item IDs
      const updatedReceiptItemTaxes = receiptItemTaxData.map((tax, index) => ({
        ...tax,
        receiptItemId: insertedReceiptItems[Math.floor(index / 2)]?.id || insertedReceiptItems[0].id
      }));
      
      // Insert receipt item taxes
      if (updatedReceiptItemTaxes.length > 0) {
        await db.insert(receiptItemTaxes).values(updatedReceiptItemTaxes);
        console.log(`✅ Inserted ${updatedReceiptItemTaxes.length} receipt item taxes`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding receipts:', error);
    throw error;
  }
}

async function seedDatabase() {
  const startTime = Date.now();
  console.log('🌱 Starting database seeding process...');
  console.log(`📊 Configuration: ${SEED_CONFIG.products} products, ${SEED_CONFIG.invoices} invoices, ${SEED_CONFIG.receipts} receipts`);
  
  try {
    // Initialize database (run migrations if needed)
    await initializeDatabase();
    
    // Wipe existing data
    await wipeDatabase();
    
    // Seed new data
    const productIds = await seedProducts();
    await seedInvoices(productIds);
    await seedReceipts(productIds);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('📈 Summary:');
    console.log(`   • ${SEED_CONFIG.products} products with taxes`);
    console.log(`   • ${SEED_CONFIG.invoices} invoices with line items and taxes`);
    console.log(`   • ${SEED_CONFIG.receipts} receipts with line items and taxes`);
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

// Run seeding if this script is executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('seed-database.ts');
if (isMainModule) {
  seedDatabase().catch((error) => {
    console.error('💥 Unhandled error during seeding:', error);
    process.exit(1);
  });
}

export { seedDatabase, wipeDatabase, SEED_CONFIG };