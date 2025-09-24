import { useState, useEffect } from "react";
import { Grid, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { Input } from "@progress/kendo-react-inputs";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { Fade, Slide, Expand } from "@progress/kendo-react-animation";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Loader } from "@progress/kendo-react-indicators";
import { Card, CardBody, CardHeader, CardTitle } from "@progress/kendo-react-layout";
import { Plus, Trash2, Edit, FileText, Download, X, TrendingUp, DollarSign, FileCheck, Clock } from "lucide-react";
import { trpc } from "../lib/trpc";
import TaxManager from "./TaxManager";

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
  taxes: {
    taxName: string;
    taxRate: number;
    taxAmount: number;
  }[];
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
      taxes: [],
      lineTotal: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
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
  const { data: invoices = [], refetch, isLoading } = trpc.invoices.list.useQuery();
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

  // Calculate statistics
  const stats = {
    total: invoices.length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalValue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidValue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
  };

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
        <div className="flex gap-1 justify-center">
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleEdit(dataItem)}
            title="Edit Invoice"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleExportPDF(dataItem.id)}
            title="Export to PDF"
            disabled={exportPDFMutation.isPending}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleExportExcel(dataItem.id)}
            title="Export to Excel"
            disabled={exportExcelMutation.isPending}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            themeColor="error"
            onClick={() => handleDelete(dataItem.id)}
            title="Delete Invoice"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    );
  };

  const StatusCell = (props: any) => {
    const { dataItem } = props;
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', icon: FileCheck },
      paid: { color: 'bg-green-100 text-green-800', icon: DollarSign },
      overdue: { color: 'bg-red-100 text-red-800', icon: TrendingUp },
    };
    
    const config = statusConfig[dataItem.status as keyof typeof statusConfig];
    const IconComponent = config?.icon || Clock;
    
    return (
      <td>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
          <IconComponent className="w-3 h-3 mr-1" />
          {dataItem.status}
        </span>
      </td>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4" style={{ borderLeftColor: color }}>
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div 
            className="p-3 rounded-full bg-gradient-to-br from-opacity-20 to-opacity-30"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader size="large" />
          <span className="ml-3 text-lg">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <Fade>
      <div className="py-6 px-12 space-y-6 w-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Invoice Management</h2>
            <p className="text-gray-600 mt-1">Manage your B2B invoices and track payments</p>
          </div>
          <Button
            themeColor="primary"
            onClick={handleCreate}
            size="large"
            disabled={createMutation.isPending}
          >
            <span className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
              Create Invoice
            </span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoices"
            value={stats.total}
            icon={FileText}
            color="#3b82f6"
            subtitle={`${stats.draft} draft, ${stats.sent} sent`}
          />
          <StatCard
            title="Paid Invoices"
            value={stats.paid}
            icon={DollarSign}
            color="#10b981"
            subtitle={`${((stats.paid / stats.total) * 100 || 0).toFixed(1)}% completion rate`}
          />
          <StatCard
            title="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon={TrendingUp}
            color="#8b5cf6"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={Clock}
            color="#ef4444"
            subtitle={stats.overdue > 0 ? "Requires attention" : "All up to date"}
          />
        </div>

        {/* Progress Bar for Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Paid: ${stats.paidValue.toLocaleString()}</span>
                <span>Total: ${stats.totalValue.toLocaleString()}</span>
              </div>
              <ProgressBar 
                value={(stats.paidValue / stats.totalValue) * 100 || 0}
                className="h-3"
              />
              <div className="text-xs text-gray-500 text-center">
                {((stats.paidValue / stats.totalValue) * 100 || 0).toFixed(1)}% of total invoice value collected
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Grid */}
        <Card>
          <CardBody className="p-0">
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
                <div className="flex justify-between items-center w-full p-4">
                  <span className="text-sm text-gray-600">
                    Showing {invoices.length} invoices
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      fillMode="outline"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <span className="flex items-center">
                        Refresh
                      </span>
                    </Button>
                  </div>
                </div>
              </GridToolbar>
              
              <GridColumn field="invoiceNumber" title="Invoice #" />
              <GridColumn field="clientName" title="Client" />
              <GridColumn field="issueDate" title="Issue Date" format="{0:d}" />
              <GridColumn field="dueDate" title="Due Date" format="{0:d}" />
              <GridColumn 
                field="status" 
                title="Status" 
                cells={{ data: StatusCell }}
              />
              <GridColumn 
                field="total" 
                title="Total" 
                format="{0:c2}"
                className="text-right font-semibold"
              />
              <GridColumn
                title="Actions"
                cells={{ data: ActionCell }}
                filterable={false}
                sortable={false}
              />
            </Grid>
          </CardBody>
        </Card>

        {/* Dialog with Animation */}
        {showDialog && (
          <Slide direction="up">
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
          </Slide>
        )}
      </div>
    </Fade>
  );
}