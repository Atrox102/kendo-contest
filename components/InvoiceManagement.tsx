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

interface Invoice {
  id?: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: string;
  issuerName: string;
  issuerAddress?: string;
  issuerTaxId?: string;
  clientName: string;
  clientAddress?: string;
  clientTaxId?: string;
  subtotal: number;
  totalTax: number;
  total: number;
  notes?: string;
  items?: InvoiceItem[];
}

interface InvoiceItem {
  id?: number;
  productId?: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

const InvoiceForm = ({ invoice, onSubmit, onCancel }: {
  invoice?: Invoice;
  onSubmit: (data: Invoice) => void;
  onCancel: () => void;
}) => {
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || []);
  const { data: products = [] } = trpc.products.list.useQuery();

  const addItem = () => {
    setItems([...items, {
      productId: undefined,
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals for this item
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      item.taxAmount = subtotal * item.taxRate;
      item.lineTotal = subtotal + item.taxAmount;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const handleSubmit = (dataItem: any) => {
    const { subtotal, totalTax, total } = calculateTotals();
    
    onSubmit({
      id: invoice?.id,
      invoiceNumber: dataItem.invoiceNumber,
      issueDate: dataItem.issueDate,
      dueDate: dataItem.dueDate,
      status: dataItem.status || 'draft',
      issuerName: dataItem.issuerName,
      issuerAddress: dataItem.issuerAddress,
      issuerTaxId: dataItem.issuerTaxId,
      clientName: dataItem.clientName,
      clientAddress: dataItem.clientAddress,
      clientTaxId: dataItem.clientTaxId,
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
        invoiceNumber: invoice?.invoiceNumber || '',
        issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
        dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : null,
        status: invoice?.status || 'draft',
        issuerName: invoice?.issuerName || '',
        issuerAddress: invoice?.issuerAddress || '',
        issuerTaxId: invoice?.issuerTaxId || '',
        clientName: invoice?.clientName || '',
        clientAddress: invoice?.clientAddress || '',
        clientTaxId: invoice?.clientTaxId || '',
        notes: invoice?.notes || '',
      }}
      render={(formRenderProps) => (
        <FormElement style={{ maxWidth: 800 }}>
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">Invoice Details</legend>
              
              <Field
                name="invoiceNumber"
                component={Input}
                label="Invoice Number"
                required
              />
              
              <Field
                name="issueDate"
                component={DatePicker}
                label="Issue Date"
                required
              />
              
              <Field
                name="dueDate"
                component={DatePicker}
                label="Due Date"
              />
              
              <Field
                name="status"
                component={DropDownList}
                label="Status"
                data={['draft', 'sent', 'paid', 'overdue']}
              />
            </fieldset>

            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">Issuer Information</legend>
              
              <Field
                name="issuerName"
                component={Input}
                label="Company Name"
                required
              />
              
              <Field
                name="issuerAddress"
                component={Input}
                label="Address"
              />
              
              <Field
                name="issuerTaxId"
                component={Input}
                label="Tax ID"
              />
            </fieldset>
          </div>

          <fieldset className="k-form-fieldset">
            <legend className="k-form-legend">Client Information</legend>
            
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="clientName"
                component={Input}
                label="Client Name"
                required
              />
              
              <Field
                name="clientAddress"
                component={Input}
                label="Client Address"
              />
              
              <Field
                name="clientTaxId"
                component={Input}
                label="Client Tax ID"
              />
            </div>
          </fieldset>

          <fieldset className="k-form-fieldset">
            <legend className="k-form-legend">Line Items</legend>
            
            <div className="mb-4">
              <Button
                type="button"
                onClick={addItem}
                fillMode="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="border p-4 mb-4 rounded">
                <div className="grid grid-cols-6 gap-2 items-end">
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
                          // Apply default tax rate from product's taxes (first tax or 0 if no taxes)
                          const defaultTax = product.taxes?.find(t => t.isDefault) || product.taxes?.[0];
                          updateItem(index, 'taxRate', defaultTax ? defaultTax.taxRate / 100 : 0);
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
                  
                  <div>
                    <label className="k-label">Tax Rate</label>
                    <NumericTextBox
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, 'taxRate', e.value)}
                      format="p2"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  
                  <div>
                    <label className="k-label">Line Total</label>
                    <div className="k-textbox k-readonly">
                      ${item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
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
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </DialogActionsBar>
        </FormElement>
      )}
    />
  );
};

export default function InvoiceManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();

  // tRPC queries and mutations
  const { data: invoices = [], refetch } = trpc.invoices.list.useQuery();
  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingInvoice(undefined);
    },
  });
  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingInvoice(undefined);
    },
  });
  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const exportPDFMutation = trpc.exports.exportInvoicePDF.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
    },
  });

  const exportExcelMutation = trpc.exports.exportInvoiceExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
    },
  });

  const handleCreate = () => {
    setEditingInvoice(undefined);
    setShowDialog(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (data: Invoice) => {
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
        invoiceNumber: data.invoiceNumber,
        issuerName: data.issuerName,
        issuerAddress: data.issuerAddress,
        clientName: data.clientName,
        clientAddress: data.clientAddress,
          issueDate: convertDateToString(data.issueDate),
        dueDate: data.dueDate ? convertDateToString(data.dueDate) : data.dueDate,
        notes: data.notes,
        status: data.status as "draft" | "sent" | "paid" | "overdue" | undefined,
        items: processedItems,
      });
    } else {
      // For create, exclude id and ensure items is defined
      const { id, ...createData } = data;
      createMutation.mutate({
        invoiceNumber: createData.invoiceNumber,
        issuerName: createData.issuerName,
        issuerAddress: createData.issuerAddress,
        clientName: createData.clientName,
        clientAddress: createData.clientAddress,
        issueDate: convertDateToString(createData.issueDate),
        dueDate: createData.dueDate ? convertDateToString(createData.dueDate) : createData.dueDate,
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

  const StatusCell = (props: any) => {
    const { dataItem } = props;
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    
    return (
      <td>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[dataItem.status as keyof typeof statusColors]}`}>
          {dataItem.status}
        </span>
      </td>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Invoice Management (B2B)</h2>
        <Button
          themeColor="primary"
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Grid
        data={invoices}
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
              Total: {invoices.length} invoices
            </span>
          </div>
        </GridToolbar>
        
        <GridColumn field="invoiceNumber" title="Invoice #" width="150px" />
        <GridColumn field="clientName" title="Client" width="200px" />
        <GridColumn field="issueDate" title="Issue Date" width="120px" format="{0:d}" />
        <GridColumn field="dueDate" title="Due Date" width="120px" format="{0:d}" />
        <GridColumn 
          field="status" 
          title="Status" 
          width="100px"
          cells={{ data: StatusCell }}
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
          title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          onClose={() => setShowDialog(false)}
          width={900}
          height={700}
        >
          <InvoiceForm
            invoice={editingInvoice}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </Dialog>
      )}
    </div>
  );
}