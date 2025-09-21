import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@progress/kendo-react-layout";
import { Chart, ChartSeries, ChartSeriesItem, ChartCategoryAxis, ChartCategoryAxisItem, ChartValueAxis, ChartValueAxisItem, ChartLegend } from "@progress/kendo-react-charts";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { DateRangePicker } from "@progress/kendo-react-dateinputs";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { trpc } from "../lib/trpc";
import { TrendingUp, TrendingDown, DollarSign, FileText, Receipt, Package } from "lucide-react";

interface AnalyticsProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}

export default function Analytics({ className = "" }: AnalyticsProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [period, setPeriod] = useState('month');

  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: receipts = [] } = trpc.receipts.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();

  const analytics = useMemo(() => {
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
    });

    const filteredReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.issueDate);
      return receiptDate >= dateRange.start && receiptDate <= dateRange.end;
    });

    const totalInvoiceRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalReceiptRevenue = filteredReceipts.reduce((sum, rec) => sum + rec.total, 0);
    const totalRevenue = totalInvoiceRevenue + totalReceiptRevenue;
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + inv.totalTax, 0) + 
                    filteredReceipts.reduce((sum, rec) => sum + rec.totalTax, 0);

    // Revenue by month
    const revenueByMonth: Record<string, number> = {};
    [...filteredInvoices, ...filteredReceipts].forEach(doc => {
      const month = new Date(doc.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + doc.total;
    });

    // Top products by revenue
    const productRevenue: Record<string, number> = {};
    [...filteredInvoices, ...filteredReceipts].forEach(doc => {
      // Check if doc has items property (invoices and receipts have items)
      if ('items' in doc && doc.items && Array.isArray(doc.items)) {
        (doc.items as any[]).forEach((item: any) => {
          productRevenue[item.productName] = (productRevenue[item.productName] || 0) + item.lineTotal;
        });
      }
    });

    const topProducts = Object.entries(productRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ productName: name, revenue }));

    // Invoice status distribution
    const invoiceStatusCounts: Record<string, number> = filteredInvoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalInvoiceRevenue,
      totalReceiptRevenue,
      totalTax,
      invoiceCount: filteredInvoices.length,
      receiptCount: filteredReceipts.length,
      productCount: products.length,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      topProducts,
      invoiceStatusCounts: Object.entries(invoiceStatusCounts).map(([status, count]) => ({ status, count }))
    };
  }, [invoices, receipts, products, dateRange]);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }: StatCardProps) => (
    <Card className="h-full">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <DropDownList
            data={['week', 'month', 'quarter', 'year']}
            value={period}
            onChange={(e) => setPeriod(e.value)}
            className="w-32"
          />
          <DateRangePicker
            value={{ start: dateRange.start || new Date(), end: dateRange.end || new Date() }}
            onChange={(e) => setDateRange({ start: e.value.start || new Date(), end: e.value.end || new Date() })}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="12.5%"
          color="green"
        />
        <StatCard
          title="Invoices"
          value={analytics.invoiceCount.toString()}
          icon={FileText}
          trend="up"
          trendValue="8.2%"
          color="blue"
        />
        <StatCard
          title="Receipts"
          value={analytics.receiptCount.toString()}
          icon={Receipt}
          trend="up"
          trendValue="5.1%"
          color="purple"
        />
        <StatCard
          title="Products"
          value={analytics.productCount.toString()}
          icon={Package}
          trend="up"
          trendValue="2.3%"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardBody>
            <Chart style={{ height: 300 }}>
              <ChartSeries>
                <ChartSeriesItem
                  type="line"
                  data={analytics.revenueByMonth}
                  field="revenue"
                  categoryField="month"
                  name="Revenue"
                />
              </ChartSeries>
              <ChartCategoryAxis>
                <ChartCategoryAxisItem />
              </ChartCategoryAxis>
              <ChartValueAxis>
                <ChartValueAxisItem />
              </ChartValueAxis>
              <ChartLegend position="bottom" />
            </Chart>
          </CardBody>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <Chart style={{ height: 300 }}>
              <ChartSeries>
                <ChartSeriesItem
                  type="donut"
                  data={analytics.invoiceStatusCounts}
                  field="count"
                  categoryField="status"
                />
              </ChartSeries>
              <ChartLegend position="bottom" />
            </Chart>
          </CardBody>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardBody>
          <Grid data={analytics.topProducts} style={{ height: 300 }}>
            <GridColumn field="productName" title="Product Name" />
            <GridColumn 
              field="revenue" 
              title="Revenue" 
              cells={{
                data: (props: any) => <td>${props.dataItem.revenue.toLocaleString()}</td>
              }}
            />
          </Grid>
        </CardBody>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoices</span>
                <span className="font-semibold">${analytics.totalInvoiceRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Receipts</span>
                <span className="font-semibold">${analytics.totalReceiptRevenue.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Total Revenue</span>
                  <span className="font-bold text-lg">${analytics.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tax Collected</span>
                <span className="font-semibold">${analytics.totalTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax Rate (Avg)</span>
                <span className="font-semibold">
                  {analytics.totalRevenue > 0 ? ((analytics.totalTax / (analytics.totalRevenue - analytics.totalTax)) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Net Revenue</span>
                  <span className="font-bold text-lg">${(analytics.totalRevenue - analytics.totalTax).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}