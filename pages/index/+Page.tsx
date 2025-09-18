
import { useState } from "react";
import Navigation from "../../components/Navigation";
import ProductManagement from "../../components/ProductManagement";
import InvoiceManagement from "../../components/InvoiceManagement";
import ReceiptManagement from "../../components/ReceiptManagement";

export default function Page() {
  const [currentPage, setCurrentPage] = useState('products');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'products':
        return <ProductManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'receipts':
        return <ReceiptManagement />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="max-w-7xl mx-auto">
        {renderCurrentPage()}
      </main>
    </div>
  );
}
