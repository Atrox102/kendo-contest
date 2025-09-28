import { Button } from "@progress/kendo-react-buttons";
import { useState } from "react";
import { Package, FileText, Receipt, BarChart3, Menu, X } from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pages = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'invoices', label: 'Invoices (B2B)', icon: FileText },
    { id: 'receipts', label: 'Receipts (B2C)', icon: Receipt },
  ];

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false); // Close mobile menu when page changes
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              <span className="hidden sm:inline">Invoice & Receipt Generator</span>
              <span className="sm:hidden">Invoice Gen</span>
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {pages.map((page) => {
              const IconComponent = page.icon;
              return (
                <Button
                  key={page.id}
                  onClick={() => handlePageChange(page.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  fillMode={currentPage === page.id ? 'solid' : 'flat'}
                  themeColor={currentPage === page.id ? 'primary' : 'base'}
                >
                  <span className="flex justify-center items-center">
                    <IconComponent className="w-4 h-4 mr-2" />
                    {page.label}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              fillMode="flat"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              {pages.map((page) => {
                const IconComponent = page.icon;
                return (
                  <Button
                    key={page.id}
                    onClick={() => handlePageChange(page.id)}
                    className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                      currentPage === page.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    fillMode={currentPage === page.id ? 'solid' : 'flat'}
                    themeColor={currentPage === page.id ? 'primary' : 'base'}
                  >
                    <span className="flex items-center">
                      <IconComponent className="w-4 h-4 mr-3" />
                      {page.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}