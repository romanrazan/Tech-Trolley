import { DataSource } from 'typeorm';
export declare class ReportsService {
    private dataSource;
    constructor(dataSource: DataSource);
    getDashboardStats(): Promise<{
        totalSales: number;
        totalPurchases: number;
        totalExpenses: number;
        totalCustomers: number;
        totalProducts: number;
    }>;
    getSalesChartData(): Promise<Array<{
        date: string;
        total: string;
    }>>;
}
