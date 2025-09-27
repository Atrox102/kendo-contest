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
import { Plus, Trash2, Edit, FileText, Download, X, Receipt, CreditCard, TrendingUp, Calendar, DollarSign, ShoppingBag, Search, Filter } from "lucide-react";
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

  // Update items when receipt prop changes
  useEffect(() => {
    if (receipt?.items) {
      // Ensure all items have properly calculated taxes and line totals
      const updatedItems = receipt.items.map(item => {
        const subtotal = item.quantity * item.unitPrice;
        const updatedTaxes = item.taxes.map(tax => ({
          ...tax,
          taxAmount: subtotal * tax.taxRate
        }));
        const totalTaxAmount = updatedTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
        return {
          ...item,
          taxes: updatedTaxes,
          lineTotal: subtotal + totalTaxAmount
        };
      });
      setItems(updatedItems);
    } else {
      setItems([]);
    }
  }, [receipt]);

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
    <Fade>
      <Form
        key={receipt?.id || 'new'}
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
                  data={['cash', 'card', 'transfer']}
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
              <legend className="k-form-legend">
                Items Purchased
                <Button
                  type="button"
                  onClick={addItem}
                  className="ml-2"
                  size="small"
                  themeColor="primary"
                  fillMode="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </legend>
              
              {items.map((item, index) => (
                <Expand key={index}>
                  <div className="border border-gray-200 p-4 mb-4 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">Item {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="small"
                        themeColor="error"
                        fillMode="outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Basic item info */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
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
                        <div className="k-textbox k-readonly text-lg font-semibold text-green-600">
                          ${item.lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Expand>
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
    </Fade>
  );
};

export default function ReceiptManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | undefined>();
  const [editingReceiptId, setEditingReceiptId] = useState<number | undefined>();

  // tRPC queries and mutations
  const { data: receipts = [], refetch, isLoading } = trpc.receipts.list.useQuery();
  const { data: fullReceiptData, isLoading: isLoadingFullReceipt } = trpc.receipts.getById.useQuery(
    { id: editingReceiptId! },
    { enabled: !!editingReceiptId }
  );
  const createMutation = trpc.receipts.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingReceipt(undefined);
      setEditingReceiptId(undefined);
    },
  });
  const updateMutation = trpc.receipts.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingReceipt(undefined);
      setEditingReceiptId(undefined);
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

  // Calculate statistics
  const stats = {
    total: receipts.length,
    totalRevenue: receipts.reduce((sum, r) => sum + r.total, 0),
    averageAmount: receipts.length > 0 ? receipts.reduce((sum, r) => sum + r.total, 0) / receipts.length : 0,
    totalTax: receipts.reduce((sum, r) => sum + r.totalTax, 0),
    paymentMethods: {
      cash: receipts.filter(r => r.paymentMethod === 'cash').length,
      card: receipts.filter(r => r.paymentMethod === 'card').length,
      transfer: receipts.filter(r => r.paymentMethod === 'transfer').length,
    },
    thisMonth: receipts.filter(r => {
      const receiptDate = new Date(r.issueDate);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
    }).length,
  };

  // Effect to handle full receipt data loading
  useEffect(() => {
    if (fullReceiptData && editingReceiptId) {
      // Convert database types to frontend types, handling nullable fields
      const convertedReceipt: Receipt = {
        ...fullReceiptData,
        paymentMethod: fullReceiptData.paymentMethod || 'cash', // Default to 'cash' if null
        issuerAddress: fullReceiptData.issuerAddress || undefined, // Handle nullable issuerAddress
        notes: fullReceiptData.notes || undefined, // Handle nullable notes
        items: fullReceiptData.items?.map(item => ({
          ...item,
          productId: item.productId || undefined, // Convert null to undefined
          description: item.description || undefined, // Convert null to undefined
        })) || [], // Handle nullable items
      };
      setEditingReceipt(convertedReceipt);
      setShowDialog(true);
    }
  }, [fullReceiptData, editingReceiptId]);

  const handleCreate = () => {
    setEditingReceipt(undefined);
    setEditingReceiptId(undefined);
    setShowDialog(true);
  };

  const handleEdit = (receipt: Receipt) => {
    if (receipt.id) {
      setEditingReceiptId(receipt.id);
      // The useEffect above will handle setting the editingReceipt and showing dialog
      // once the full data is loaded
    }
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
        <div className="flex gap-1 justify-center">
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleEdit(dataItem)}
            title="Edit Receipt"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleExportPDF(dataItem.id)}
            title="Export PDF"
            disabled={exportPDFMutation.isPending}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            onClick={() => handleExportExcel(dataItem.id)}
            title="Export Excel"
            disabled={exportExcelMutation.isPending}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            themeColor="error"
            onClick={() => handleDelete(dataItem.id)}
            title="Delete Receipt"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    );
  };

  const PaymentMethodCell = (props: any) => {
    const { dataItem } = props;
    const methodConfig = {
      cash: { color: 'bg-green-100 text-green-800', icon: DollarSign },
      card: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      check: { color: 'bg-yellow-100 text-yellow-800', icon: FileText },
      bank_transfer: { color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      digital_wallet: { color: 'bg-indigo-100 text-indigo-800', icon: CreditCard },
    };
    
    const config = methodConfig[dataItem.paymentMethod as keyof typeof methodConfig] || methodConfig.cash;
    const Icon = config.icon;
    
    return (
      <td>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {dataItem.paymentMethod.replace('_', ' ')}
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
          <span className="ml-3 text-lg">Loading receipts...</span>
        </div>
      </div>
    );
  }

  return (
    <Fade>
      <div className="py-6 px-12  space-y-6 w-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Receipt Management (B2C)</h2>
            <p className="text-gray-600 mt-1">Manage customer receipts and transactions</p>
          </div>
          <Button
            themeColor="primary"
            onClick={handleCreate}
            size="large"
            disabled={createMutation.isPending}
          >
            <span className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Receipt
            </span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Receipts"
            value={stats.total}
            icon={Receipt}
            color="#3b82f6"
            subtitle={`${stats.thisMonth} this month`}
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="#10b981"
            subtitle={`Avg: $${stats.averageAmount.toFixed(2)}`}
          />
          <StatCard
            title="Total Tax Collected"
            value={`$${stats.totalTax.toLocaleString()}`}
            icon={TrendingUp}
            color="#8b5cf6"
          />
          <StatCard
            title="Payment Methods"
            value={`${stats.paymentMethods.cash + stats.paymentMethods.card + stats.paymentMethods.transfer}`}
            icon={CreditCard}
            color="#f59e0b"
            subtitle={`Cash: ${stats.paymentMethods.cash}, Card: ${stats.paymentMethods.card}, Transfer: ${stats.paymentMethods.transfer}`}
          />
        </div>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Cash: {stats.paymentMethods.cash}</span>
                <span>Card: {stats.paymentMethods.card}</span>
                <span>Transfer: {stats.paymentMethods.transfer}</span>
              </div>
              <ProgressBar 
                value={stats.total > 0 ? (stats.paymentMethods.card / stats.total) * 100 : 0}
                className="h-3"
              />
              <div className="text-xs text-gray-500 text-center">
                {stats.total > 0 ? ((stats.paymentMethods.card / stats.total) * 100).toFixed(1) : 0}% card payments
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Grid */}
        <Card>
          <CardBody className="p-0">
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
                <div className="flex justify-between items-center w-full p-4">
                  <span className="text-sm text-gray-600">
                    Showing {receipts.length} receipts
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      fillMode="outline"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      
                    >
                      <span className="flex items-center">
                      <Search className="w-4 h-4 mr-1" />
                      Refresh
                      </span>
                    </Button>
                  </div>
                </div>
              </GridToolbar>
              
              <GridColumn field="receiptNumber" title="Receipt #" />
              <GridColumn field="issuerName" title="Business" />
              <GridColumn field="issueDate" title="Date" format="{0:d}" />
              <GridColumn 
                field="paymentMethod" 
                title="Payment" 
                cells={{ data: PaymentMethodCell }}
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
              title={editingReceipt ? 'Edit Receipt' : 'Create New Receipt'}
              onClose={() => {
                setShowDialog(false);
                setEditingReceipt(undefined);
                setEditingReceiptId(undefined);
              }}
              width={700}
              height={700}
            >
              {isLoadingFullReceipt && editingReceiptId ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                  <Loader size="large" />
                  <span style={{ marginLeft: '10px' }}>Loading receipt details...</span>
                </div>
              ) : (
                <ReceiptForm
                  receipt={editingReceipt}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowDialog(false);
                    setEditingReceipt(undefined);
                    setEditingReceiptId(undefined);
                  }}
                />
              )}
            </Dialog>
          </Slide>
        )}
      </div>
    </Fade>
  );
}