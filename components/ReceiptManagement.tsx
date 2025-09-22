import { useState } from "react";
import { Grid, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { Input } from "@progress/kendo-react-inputs";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { Plus, Trash2, Edit, FileText, Download, X } from "lucide-react";
import { trpc } from "../lib/trpc";
import TaxManager from "./TaxManager";

interface Receipt {
  id?: number;
  receiptNumber: string;
  issueDate: string;
  paymentMethod: string;
  issuerName: string;
  issuerAddress?: string;
  subtotal: number;
  totalTax: number;
  total: number;
  notes?: string;
  items?: ReceiptItem[];
}

interface ReceiptItem {
  id?: number;
  productId?: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxes: {
    taxName: string;
    taxRate: number;
    taxAmount: number;
  }[];
  lineTotal: number;
}

const ReceiptForm = ({ receipt, onSubmit, onCancel }: {
  receipt?: Receipt;
  onSubmit: (data: Receipt) => void;
  onCancel: () => void;
}) => {
  const [items, setItems] = useState<ReceiptItem[]>(receipt?.items || []);
  const { data: products = [] } = trpc.products.list.useQuery();

  const addItem = () => {
    setItems([...items, {
      productId: undefined,
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxes: [],
      lineTotal: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-populate product details when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].description = product.description || '';
        newItems[index].unitPrice = product.defaultPrice;
        // Set taxes from product
        newItems[index].taxes = product.taxes?.map(tax => ({
          taxName: tax.taxName,
          taxRate: tax.taxRate,
          taxAmount: 0
        })) || [];
      }
    }
    
    // Recalculate totals for this item
    if (field === 'quantity' || field === 'unitPrice') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      // Calculate tax amounts for each tax
      item.taxes.forEach(tax => {
        tax.taxAmount = subtotal * tax.taxRate;
      });
      const totalTaxAmount = item.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
      item.lineTotal = subtotal + totalTaxAmount;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = items.reduce((sum, item) => 
      sum + item.taxes.reduce((taxSum, tax) => taxSum + tax.taxAmount, 0), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const handleSubmit = (dataItem: any) => {
    const { subtotal, totalTax, total } = calculateTotals();
    
    onSubmit({
      id: receipt?.id,
      receiptNumber: dataItem.receiptNumber,
      issueDate: dataItem.issueDate,
      paymentMethod: dataItem.paymentMethod,
      issuerName: dataItem.issuerName,
      issuerAddress: dataItem.issuerAddress,
      subtotal,
      totalTax,
      total,
      notes: dataItem.notes,
      items,
    });
  };

  const { subtotal, totalTax, total } = calculateTotals();

  return (
    <Form
      onSubmit={handleSubmit}
      initialValues={{
        receiptNumber: receipt?.receiptNumber || '',
        issueDate: receipt?.issueDate ? new Date(receipt.issueDate) : new Date(),
        paymentMethod: receipt?.paymentMethod || 'cash',
        issuerName: receipt?.issuerName || '',
        issuerAddress: receipt?.issuerAddress || '',
        notes: receipt?.notes || '',
      }}
      render={(formRenderProps) => (
        <FormElement style={{ maxWidth: 700 }}>
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">Receipt Details</legend>
              
              <Field
                name="receiptNumber"
                component={Input}
                label="Receipt Number"
                required
              />
              
              <Field
                name="issueDate"
                component={DatePicker}
                label="Issue Date"
                required
              />
              
              <Field
                name="paymentMethod"
                component={DropDownList}
                label="Payment Method"
                data={['cash', 'card', 'check', 'bank_transfer', 'digital_wallet']}
                required
              />
            </fieldset>

            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">Business Information</legend>
              
              <Field
                name="issuerName"
                component={Input}
                label="Business Name"
                required
              />
              
              <Field
                name="issuerAddress"
                component={Input}
                label="Address"
              />
            </fieldset>
          </div>

          <fieldset className="k-form-fieldset">
            <legend className="k-form-legend">Items Purchased</legend>
            
            <div className="mb-4">
              <Button
                type="button"
                icon="plus"
                onClick={addItem}
                fillMode="outline"
              >
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="border p-4 mb-4 rounded">
                {/* Basic item info */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="k-label">Product</label>
                    <DropDownList
                      data={products}
                      textField="name"
                      dataItemKey="name"
                      value={item.productName}
                      onChange={(e) => {
                        const product = products.find(p => p.name === e.value);
                        updateItem(index, 'productName', e.value);
                        if (product) {
                          updateItem(index, 'productId', product.id);
                          updateItem(index, 'unitPrice', product.defaultPrice);
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="k-label">Quantity</label>
                    <NumericTextBox
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.value)}
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <label className="k-label">Unit Price</label>
                    <NumericTextBox
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.value)}
                      format="c2"
                      min={0}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      fillMode="flat"
                      themeColor="error"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tax management and totals */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <TaxManager
                      taxes={item.taxes}
                      subtotal={item.quantity * item.unitPrice}
                      onChange={(taxes) => {
                        const updatedItems = [...items];
                        updatedItems[index] = {
                          ...item,
                          taxes,
                          lineTotal: (item.quantity * item.unitPrice) + taxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
                        };
                        setItems(updatedItems);
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <label className="k-label">Line Total</label>
                    <div className="k-textbox k-readonly text-lg font-semibold">
                      ${item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="text-right space-y-2">
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                <div>Tax: ${totalTax.toFixed(2)}</div>
                <div className="text-lg font-bold">Total: ${total.toFixed(2)}</div>
              </div>
            </div>
          </fieldset>

          <Field
            name="notes"
            component={Input}
            label="Notes"
          />
          
          <DialogActionsBar>
            <Button
              type="submit"
              themeColor="primary"
              disabled={!formRenderProps.allowSubmit}
            >
              {receipt ? 'Update' : 'Create'} Receipt
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </DialogActionsBar>
        </FormElement>
      )}
    />
  );
};

export default function ReceiptManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | undefined>();

  // tRPC queries and mutations
  const { data: receipts = [], refetch } = trpc.receipts.list.useQuery();
  const createMutation = trpc.receipts.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingReceipt(undefined);
    },
  });
  const updateMutation = trpc.receipts.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingReceipt(undefined);
    },
  });
  const deleteMutation = trpc.receipts.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const exportPDFMutation = trpc.exports.exportReceiptPDF.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
    },
  });

  const exportExcelMutation = trpc.exports.exportReceiptExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
    },
  });

  const handleCreate = () => {
    setEditingReceipt(undefined);
    setShowDialog(true);
  };

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (data: Receipt) => {
    // Convert dates to ISO strings and process items
    const processedItems = (data.items || []).map(item => {
      // Handle productName which might be an object with a name property
      let productName = item.productName;
      if (typeof item.productName === 'object' && item.productName !== null && 'name' in item.productName) {
        productName = (item.productName as any).name;
      }
      
      return {
        ...item,
        productName: productName as string
      };
    });

    // Helper function to convert dates to ISO strings
    const convertDateToString = (date: any): string => {
      if (date instanceof Date) {
        return date.toISOString();
      }
      return date as string;
    };

    if (data.id) {
      // For update, ensure id is a number and items is defined
      updateMutation.mutate({
        id: data.id,
        receiptNumber: data.receiptNumber,
        issuerName: data.issuerName,
        issuerAddress: data.issuerAddress,
        issueDate: convertDateToString(data.issueDate),
        paymentMethod: data.paymentMethod as "cash" | "card" | "transfer",
        notes: data.notes,
        items: processedItems,
      });
    } else {
      // For create, exclude id and ensure items is defined
      const { id, ...createData } = data;
      createMutation.mutate({
        receiptNumber: createData.receiptNumber,
        issuerName: createData.issuerName,
        issuerAddress: createData.issuerAddress,
        issueDate: convertDateToString(createData.issueDate),
        paymentMethod: createData.paymentMethod as "cash" | "card" | "transfer",
        notes: createData.notes,
        items: processedItems,
      });
    }
  };

  const handleExportPDF = (id: number) => {
    exportPDFMutation.mutate({ id });
  };

  const handleExportExcel = (id: number) => {
    exportExcelMutation.mutate({ id });
  };

  const ActionCell = (props: any) => {
    const { dataItem } = props;
    return (
      <td className="text-center">
        <Button
          size="small"
          fillMode="flat"
          onClick={() => handleEdit(dataItem)}
          className="mr-1"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          size="small"
          fillMode="flat"
          onClick={() => handleExportPDF(dataItem.id)}
          className="mr-1"
        >
          <FileText className="w-4 h-4 mr-1" />
          PDF
        </Button>
        <Button
          size="small"
          fillMode="flat"
          onClick={() => handleExportExcel(dataItem.id)}
          className="mr-1"
        >
          <Download className="w-4 h-4 mr-1" />
          Excel
        </Button>
        <Button
          size="small"
          fillMode="flat"
          themeColor="error"
          onClick={() => handleDelete(dataItem.id)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </td>
    );
  };

  const PaymentMethodCell = (props: any) => {
    const { dataItem } = props;
    const methodColors = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      check: 'bg-yellow-100 text-yellow-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      digital_wallet: 'bg-indigo-100 text-indigo-800',
    };
    
    return (
      <td>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodColors[dataItem.paymentMethod as keyof typeof methodColors]}`}>
          {dataItem.paymentMethod.replace('_', ' ')}
        </span>
      </td>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Receipt Management (B2C)</h2>
        <Button
          themeColor="primary"
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Receipt
        </Button>
      </div>

      <Grid
        data={receipts}
        style={{ height: '600px' }}
        sortable
        filterable
        pageable={{
          buttonCount: 5,
          pageSizes: [10, 20, 50],
        }}
      >
        <GridToolbar>
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-gray-600">
              Total: {receipts.length} receipts
            </span>
          </div>
        </GridToolbar>
        
        <GridColumn field="receiptNumber" title="Receipt #" width="150px" />
        <GridColumn field="issuerName" title="Business" width="200px" />
        <GridColumn field="issueDate" title="Date" width="120px" format="{0:d}" />
        <GridColumn 
          field="paymentMethod" 
          title="Payment" 
          width="120px"
          cells={{ data: PaymentMethodCell }}
        />
        <GridColumn 
          field="total" 
          title="Total" 
          width="120px"
          format="{0:c2}"
          className="text-right"
        />
        <GridColumn
          title="Actions"
          width="300px"
          cells={{ data: ActionCell }}
          filterable={false}
          sortable={false}
        />
      </Grid>

      {showDialog && (
        <Dialog
          title={editingReceipt ? 'Edit Receipt' : 'Create New Receipt'}
          onClose={() => setShowDialog(false)}
          width={800}
          height={600}
        >
          <ReceiptForm
            receipt={editingReceipt}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </Dialog>
      )}
    </div>
  );
}