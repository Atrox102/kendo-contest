import React, { useState } from "react";
import { Grid, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { Input } from "@progress/kendo-react-inputs";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { Fade, Slide, Expand } from "@progress/kendo-react-animation";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Loader } from "@progress/kendo-react-indicators";
import { Card, CardBody, CardHeader, CardTitle } from "@progress/kendo-react-layout";
import { Edit, Trash2, Plus, Package, DollarSign, TrendingUp, Tag, Search, Filter } from "lucide-react";
import { trpc } from "../lib/trpc";

interface Product {
  id?: number;
  name: string;
  description?: string;
  defaultPrice: number;
  taxes: {
    taxName: string;
    taxRate: number;
    isDefault?: boolean;
  }[];
}

const ProductForm = ({ product, onSubmit, onCancel }: {
  product?: Product;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
}) => {
  const [taxes, setTaxes] = useState(
    product?.taxes?.length ? product.taxes : [{ taxName: 'VAT', taxRate: 0, isDefault: true }]
  );

  const handleSubmit = (dataItem: any) => {
    onSubmit({
      id: product?.id,
      name: dataItem.name,
      description: dataItem.description || '',
      defaultPrice: parseFloat(dataItem.price) || 0,
      taxes: taxes,
    });
  };

  const addTax = () => {
    setTaxes([...taxes, { taxName: '', taxRate: 0, isDefault: false }]);
  };

  const removeTax = (index: number) => {
    if (taxes.length > 1) {
      setTaxes(taxes.filter((_, i) => i !== index));
    }
  };

  const updateTax = (index: number, field: string, value: any) => {
    const updatedTaxes = [...taxes];
    updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
    setTaxes(updatedTaxes);
  };

  return (
    <Fade>
      <Form
        onSubmit={handleSubmit}
        initialValues={{
          name: product?.name || '',
          description: product?.description || '',
          price: product?.defaultPrice || 0,
        }}
        render={(formRenderProps) => (
          <FormElement style={{ maxWidth: 650 }}>
            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">Product Information</legend>
              
              <Field
                name="name"
                component={Input}
                label="Product Name"
                required
                validator={(value) => !value ? "Product name is required" : ""}
              />
              
              <Field
                name="description"
                component={Input}
                label="Description"
              />
              
              <Field
                name="price"
                component={NumericTextBox}
                label="Price ($)"
                required
                format="c2"
                min={0}
                validator={(value) => !value || value <= 0 ? "Price must be greater than 0" : ""}
              />
            </fieldset>

            <fieldset className="k-form-fieldset">
              <legend className="k-form-legend">
                Tax Information
                <Button
                  type="button"
                  onClick={addTax}
                  className="ml-2"
                  size="small"
                  themeColor="primary"
                  fillMode="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tax
                </Button>
              </legend>
              
              {taxes.map((tax, index) => (
                <Expand key={index}>
                  <div className="border border-gray-200 p-4 mb-4 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">Tax {index + 1}</h4>
                      {taxes.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTax(index)}
                          size="small"
                          themeColor="error"
                          fillMode="outline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="k-label">Tax Name</label>
                        <Input
                          value={tax.taxName}
                          onChange={(e) => updateTax(index, 'taxName', e.target.value)}
                          placeholder="e.g., VAT, GST, Sales Tax"
                        />
                      </div>
                      
                      <div>
                        <label className="k-label">Tax Rate (%)</label>
                        <NumericTextBox
                          value={tax.taxRate}
                          onChange={(e) => updateTax(index, 'taxRate', e.target.value || 0)}
                          format="n2"
                          min={0}
                          max={100}
                          step={0.01}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="k-checkbox-label flex items-center">
                        <input
                          type="checkbox"
                          className="k-checkbox mr-2"
                          checked={tax.isDefault || false}
                          onChange={(e) => updateTax(index, 'isDefault', e.target.checked)}
                        />
                        Default Tax
                      </label>
                    </div>
                  </div>
                </Expand>
              ))}
            </fieldset>
            
            <DialogActionsBar>
              <Button
                type="submit"
                themeColor="primary"
                disabled={!formRenderProps.allowSubmit}
              >
                {product ? 'Update' : 'Create'}
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </DialogActionsBar>
          </FormElement>
        )}
      />
    </Fade>
  );
};

export default function ProductManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // tRPC queries and mutations
  const { data: products = [], refetch, isLoading } = trpc.products.list.useQuery();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingProduct(undefined);
    },
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setEditingProduct(undefined);
    },
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Calculate statistics
  const stats = {
    total: products.length,
    averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.defaultPrice, 0) / products.length : 0,
    highestPrice: products.length > 0 ? Math.max(...products.map(p => p.defaultPrice)) : 0,
    totalValue: products.reduce((sum, p) => sum + p.defaultPrice, 0),
    withTaxes: products.filter(p => p.taxes && p.taxes.length > 0).length,
    uniqueTaxes: [...new Set(products.flatMap(p => p.taxes?.map(t => t.taxName) || []))].length,
  };

  const handleCreate = () => {
    setEditingProduct(undefined);
    setShowDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (data: Product) => {
    if (data.id) {
      // For update: ensure id is a number and exclude undefined fields
      updateMutation.mutate({
        id: data.id,
        name: data.name,
        description: data.description,
        defaultPrice: data.defaultPrice,
        taxes: data.taxes
      });
    } else {
      // For create: exclude id and ensure required fields are present
      createMutation.mutate({
        name: data.name,
        description: data.description,
        defaultPrice: data.defaultPrice,
        taxes: data.taxes
      });
    }
  };

  const TaxesCell = (props: any) => {
    const { dataItem } = props;
    const taxes = dataItem.taxes || [];
    
    return (
      <td>
        <div className="space-y-1">
          {taxes.map((tax: any, index: number) => (
            <div key={index} className="flex items-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Tag className="w-3 h-3 mr-1" />
                {tax.taxName}: {(tax.taxRate || 0).toFixed(2)}%
                {tax.isDefault && <span className="ml-1 text-xs">★</span>}
              </span>
            </div>
          ))}
          {taxes.length === 0 && <span className="text-gray-400 text-sm">No taxes</span>}
        </div>
      </td>
    );
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
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            fillMode="flat"
            themeColor="error"
            onClick={() => handleDelete(dataItem.id)}
            title="Delete Product"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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
          <span className="ml-3 text-lg">Loading products...</span>
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
            <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600 mt-1">Manage your product catalog and pricing</p>
          </div>
          <Button
            themeColor="primary"
            onClick={handleCreate}
            size="large"
            disabled={createMutation.isPending}
          >
            <span className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
              Add Product
            </span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={stats.total}
            icon={Package}
            color="#3b82f6"
            subtitle={`${stats.withTaxes} with taxes configured`}
          />
          <StatCard
            title="Average Price"
            value={`$${stats.averagePrice.toFixed(2)}`}
            icon={DollarSign}
            color="#10b981"
            subtitle={`Highest: $${stats.highestPrice.toFixed(2)}`}
          />
          <StatCard
            title="Total Catalog Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon={TrendingUp}
            color="#8b5cf6"
          />
          <StatCard
            title="Tax Types"
            value={stats.uniqueTaxes}
            icon={Tag}
            color="#f59e0b"
            subtitle="Unique tax configurations"
          />
        </div>

        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Average: ${stats.averagePrice.toFixed(2)}</span>
                <span>Highest: ${stats.highestPrice.toFixed(2)}</span>
              </div>
              <ProgressBar 
                value={stats.averagePrice > 0 ? (stats.averagePrice / stats.highestPrice) * 100 : 0}
                className="h-3"
              />
              <div className="text-xs text-gray-500 text-center">
                Price range analysis across {stats.total} products
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Grid */}
        <Card>
          <CardBody className="p-0">
            <Grid
              data={products}
              style={{ height: '600px' }}
              sortable
              pageable={{
                buttonCount: 5,
                pageSizes: [10, 20, 50],
              }}
            >
              <GridToolbar>
                <div className="flex justify-between items-center w-full p-4">
                  <span className="text-sm text-gray-600">
                    Showing {products.length} products
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
              
              <GridColumn field="name" title="Product Name"  />
              <GridColumn field="description" title="Description"  />
              <GridColumn 
                field="defaultPrice" 
                title="Price" 
                width="120px"
                format="{0:c2}"
                className="text-right font-semibold"
              />
              <GridColumn 
                title="Taxes" 
                cells={{ data: TaxesCell }}
                filterable={false}
                sortable={false}
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
              title={editingProduct ? 'Edit Product' : 'Add New Product'}
              onClose={() => setShowDialog(false)}
              width={700}
              height={600}
            >
              <ProductForm
                product={editingProduct}
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