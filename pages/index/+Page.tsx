
import { useState } from "react";
import Navigation from "../../components/Navigation";
import Analytics from "../../components/Analytics";
import ProductManagement from "../../components/ProductManagement";
import InvoiceManagement from "../../components/InvoiceManagement";
import ReceiptManagement from "../../components/ReceiptManagement";

export default function Page() {
  const [currentPage, setCurrentPage] = useState('analytics');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <Analytics />;
      case 'products':
        return <ProductManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'receipts':
        return <ReceiptManagement />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex justify-center items-center">
        {renderCurrentPage()}
      </main>
    </div>
  );
}
