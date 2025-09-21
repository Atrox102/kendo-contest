import React, { useState } from "react";
import { Grid, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { Input } from "@progress/kendo-react-inputs";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { Edit, Trash2, Plus } from "lucide-react";
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
              <div key={index} className="k-form-field-wrap" style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4>Tax {index + 1}</h4>
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
                
                <div style={{ marginBottom: '10px' }}>
                  <label className="k-label">Tax Name</label>
                  <Input
                    value={tax.taxName}
                    onChange={(e) => updateTax(index, 'taxName', e.target.value)}
                    placeholder="e.g., VAT, GST, Sales Tax"
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
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
                
                <div>
                  <label className="k-checkbox-label">
                    <input
                      type="checkbox"
                      className="k-checkbox"
                      checked={tax.isDefault || false}
                      onChange={(e) => updateTax(index, 'isDefault', e.target.checked)}
                    />
                    Default Tax
                  </label>
                </div>
              </div>
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
  );
};

export default function ProductManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // tRPC queries and mutations
  const { data: products = [], refetch } = trpc.products.list.useQuery();
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
            <div key={index} className="text-sm">
              <span className="font-medium">{tax.taxName}</span>: {(tax.taxRate || 0).toFixed(2)}%
              {tax.isDefault && <span className="ml-1 text-xs text-blue-600">(Default)</span>}
            </div>
          ))}
          {taxes.length === 0 && <span className="text-gray-400">No taxes</span>}
        </div>
      </td>
    );
  };

  const ActionCell = (props: any) => {
    const { dataItem } = props;
    return (
      <td className="text-center">
        <Button
          size="small"
          fillMode="flat"
          onClick={() => handleEdit(dataItem)}
          className="mr-2"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <Button
          themeColor="primary"
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Grid
        data={products}
        style={{ height: '500px' }}
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
              Total: {products.length} products
            </span>
          </div>
        </GridToolbar>
        
        <GridColumn field="name" title="Product Name" width="200px" />
        <GridColumn field="description" title="Description" width="250px" />
        <GridColumn 
          field="defaultPrice" 
          title="Price" 
          width="120px"
          format="{0:c2}"
          className="text-right"
        />
        <GridColumn 
          title="Taxes" 
          width="200px"
          cells={{ data: TaxesCell }}
          filterable={false}
          sortable={false}
        />
        <GridColumn
          title="Actions"
          width="200px"
          cells={{ data: ActionCell }}
          filterable={false}
          sortable={false}
        />
      </Grid>

      {showDialog && (
        <Dialog
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          onClose={() => setShowDialog(false)}
          width={500}
        >
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </Dialog>
      )}
    </div>
  );
}