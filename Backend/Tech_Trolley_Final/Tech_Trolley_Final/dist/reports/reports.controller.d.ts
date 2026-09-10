import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboardStats(): Promise<{
        totalSales: number;
        totalPurchases: number;
        totalExpenses: number;
        totalCustomers: number;
        totalProducts: number;
    }>;
    getSalesChartData(): Promise<{
        date: string;
        total: string;
    }[]>;
}
