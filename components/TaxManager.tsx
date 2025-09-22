import { useState } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { Plus, Trash2 } from "lucide-react";

interface Tax {
  taxName: string;
  taxRate: number;
  taxAmount: number;
}

interface TaxManagerProps {
  taxes: Tax[];
  subtotal: number;
  onChange: (taxes: Tax[]) => void;
}

export default function TaxManager({ taxes, subtotal, onChange }: TaxManagerProps) {
  const [newTax, setNewTax] = useState({ taxName: '', taxRate: 0 });

  const addTax = () => {
    if (newTax.taxName.trim() && newTax.taxRate > 0) {
      const taxAmount = (subtotal * newTax.taxRate) / 100;
      const updatedTaxes = [...taxes, {
        taxName: newTax.taxName.trim(),
        taxRate: newTax.taxRate / 100, // Convert percentage to decimal
        taxAmount: taxAmount
      }];
      onChange(updatedTaxes);
      setNewTax({ taxName: '', taxRate: 0 });
    }
  };

  const removeTax = (index: number) => {
    const updatedTaxes = taxes.filter((_, i) => i !== index);
    onChange(updatedTaxes);
  };

  const updateTax = (index: number, field: 'taxName' | 'taxRate', value: string | number) => {
    const updatedTaxes = [...taxes];
    if (field === 'taxName') {
      updatedTaxes[index].taxName = value as string;
    } else if (field === 'taxRate') {
      const rate = (value as number) / 100; // Convert percentage to decimal
      updatedTaxes[index].taxRate = rate;
      updatedTaxes[index].taxAmount = subtotal * rate;
    }
    onChange(updatedTaxes);
  };

  return (
    <div className="space-y-3">
      <label className="k-label">Taxes</label>
      
      {/* Existing taxes */}
      {taxes.map((tax, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded">
          <div className="flex-1">
            <Input
              value={tax.taxName}
              onChange={(e) => updateTax(index, 'taxName', String(e.target.value || ''))}
              placeholder="Tax name (e.g., VAT, Sales Tax)"
              style={{ width: '100%' }}
            />
          </div>
          <div className="w-24">
            <NumericTextBox
              value={tax.taxRate * 100} // Convert decimal to percentage for display
              onChange={(e) => updateTax(index, 'taxRate', e.value || 0)}
              format="n2"
              min={0}
              max={100}
              placeholder="Rate %"
            />
          </div>
          <div className="w-20 text-sm text-gray-600">
            ${tax.taxAmount.toFixed(2)}
          </div>
          <Button
            type="button"
            fillMode="flat"
            themeColor="error"
            onClick={() => removeTax(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Add new tax */}
      <div className="flex items-center gap-2 p-2 border border-dashed rounded">
        <div className="flex-1">
          <Input
            value={newTax.taxName}
            onChange={(e) => setNewTax({ ...newTax, taxName: String(e.target.value || '') })}
            placeholder="Tax name (e.g., VAT, Sales Tax)"
            style={{ width: '100%' }}
          />
        </div>
        <div className="w-24">
          <NumericTextBox
            value={newTax.taxRate}
            onChange={(e) => setNewTax({ ...newTax, taxRate: e.value || 0 })}
            format="n2"
            min={0}
            max={100}
            placeholder="Rate %"
          />
        </div>
        <div className="w-20 text-sm text-gray-600">
          ${((subtotal * newTax.taxRate) / 100).toFixed(2)}
        </div>
        <Button
          type="button"
          fillMode="outline"
          themeColor="primary"
          onClick={addTax}
          disabled={!newTax.taxName.trim() || newTax.taxRate <= 0}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tax summary */}
      {taxes.length > 0 && (
        <div className="text-sm text-gray-600 pt-2 border-t">
          Total Tax: ${taxes.reduce((sum, tax) => sum + tax.taxAmount, 0).toFixed(2)}
        </div>
      )}
    </div>
  );
}