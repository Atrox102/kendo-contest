import { useState, useMemo, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@progress/kendo-react-layout";
import { Chart, ChartSeries, ChartSeriesItem, ChartCategoryAxis, ChartCategoryAxisItem, ChartValueAxis, ChartValueAxisItem, ChartLegend } from "@progress/kendo-react-charts";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { Fade, Slide, Expand } from "@progress/kendo-react-animation";
import { Loader } from "@progress/kendo-react-indicators";
import { trpc } from "../lib/trpc";
import { DollarSign, FileText, Receipt, Package } from "lucide-react";

interface AnalyticsProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
}

export default function Analytics({ className = "" }: AnalyticsProps) {
  const [showCards, setShowCards] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: invoices = [], isLoading: invoicesLoading } = trpc.invoices.list.useQuery();
  const { data: receipts = [], isLoading: receiptsLoading } = trpc.receipts.list.useQuery();
  const { data: products = [], isLoading: productsLoading } = trpc.products.list.useQuery();

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCards(true), 300);
    const timer2 = setTimeout(() => setShowCharts(true), 600);
    const timer3 = setTimeout(() => setShowTables(true), 900);
    const loadingTimer = setTimeout(() => setIsLoading(false), 1200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(loadingTimer);
    };
  }, []);

  const analytics = useMemo(() => {
    const totalInvoiceRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalReceiptRevenue = receipts.reduce((sum, rec) => sum + rec.total, 0);
    const totalRevenue = totalInvoiceRevenue + totalReceiptRevenue;
    const totalTax = invoices.reduce((sum, inv) => sum + inv.totalTax, 0) + 
                    receipts.reduce((sum, rec) => sum + rec.totalTax, 0);

    // Revenue by month
    const revenueByMonth: Record<string, number> = {};
    [...invoices, ...receipts].forEach(doc => {
      const month = new Date(doc.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + doc.total;
    });

    // Top products by revenue
    const productRevenue: Record<string, number> = {};
    [...invoices, ...receipts].forEach(doc => {
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
    const invoiceStatusCounts: Record<string, number> = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalInvoiceRevenue,
      totalReceiptRevenue,
      totalTax,
      invoiceCount: invoices.length,
      receiptCount: receipts.length,
      productCount: products.length,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      topProducts,
      invoiceStatusCounts: Object.entries(invoiceStatusCounts).map(([status, count]) => ({ status, count }))
    };
  }, [invoices, receipts, products]);

  const StatCard = ({ title, value, icon: Icon, color = "primary" }: StatCardProps) => (
    <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500">
      <CardBody className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">{title}</p>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{value}</p>
          </div>
          <div className="ml-2 sm:ml-4 flex-shrink-0">
            <div className={`p-2 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-inner`}>
              <Icon className={`w-5 h-5 sm:w-8 sm:h-8 text-blue-600`} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (isLoading || invoicesLoading || receiptsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader size="large" />
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 px-4 sm:py-6 sm:px-6 lg:px-12 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Invoices"
          value={analytics.invoiceCount.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Receipts"
          value={analytics.receiptCount.toString()}
          icon={Receipt}
          color="purple"
        />
        <StatCard
          title="Products"
          value={analytics.productCount.toString()}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardBody className="p-2 sm:p-4">
            <div className="w-full overflow-x-auto">
              <Chart style={{ height: 250, minWidth: 300 }}>
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
            </div>
          </CardBody>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardBody className="p-2 sm:p-4">
            <div className="w-full overflow-x-auto">
              <Chart style={{ height: 250, minWidth: 300 }}>
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
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardBody className="p-2 sm:p-4">
          <div className="w-full overflow-x-auto">
            <Grid data={analytics.topProducts} style={{ height: 250, minWidth: 400 }}>
              <GridColumn field="productName" title="Product Name" />
              <GridColumn 
                field="revenue" 
                title="Revenue" 
                cells={{
                  data: (props: any) => <td>${props.dataItem.revenue.toLocaleString()}</td>
                }}
              />
            </Grid>
          </div>
        </CardBody>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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