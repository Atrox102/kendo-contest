import { Button } from "@progress/kendo-react-buttons";
import { useState } from "react";
import { Package, FileText, Receipt, BarChart3 } from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const pages = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'invoices', label: 'Invoices (B2B)', icon: FileText },
    { id: 'receipts', label: 'Receipts (B2C)', icon: Receipt },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Invoice & Receipt Generator
            </h1>
          </div>
          <div className="flex space-x-4">
            {pages.map((page) => {
              const IconComponent = page.icon;
              return (
                <Button
                  key={page.id}
                  onClick={() => onPageChange(page.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  fillMode={currentPage === page.id ? 'solid' : 'flat'}
                  themeColor={currentPage === page.id ? 'primary' : 'base'}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {page.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}