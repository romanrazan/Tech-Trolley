import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getDashboardStats(): Promise<{
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalCustomers: number;
    totalProducts: number;
  }> {
    const [salesResult] = await this.dataSource.query<
      Array<{ totalSales: string }>
    >(
      `SELECT COALESCE(SUM(total), 0) as "totalSales" FROM sale WHERE status = 'COMPLETED'`,
    );
    const [purchasesResult] = await this.dataSource.query<
      Array<{ totalPurchases: string }>
    >(
      `SELECT COALESCE(SUM(total), 0) as "totalPurchases"
       FROM purchase
       WHERE status <> 'CANCELLED'`,
    );
    const [expensesResult] = await this.dataSource.query<
      Array<{ totalExpenses: string }>
    >(`SELECT COALESCE(SUM(amount), 0) as "totalExpenses" FROM expense`);
    const [customersResult] = await this.dataSource.query<
      Array<{ totalCustomers: string }>
    >(
      `SELECT COUNT(*) as "totalCustomers"
       FROM customer
       WHERE "isActive" = true AND "deletedAt" IS NULL`,
    );
    const [productsResult] = await this.dataSource.query<
      Array<{ totalProducts: string }>
    >(
      `SELECT COUNT(*) as "totalProducts" FROM product WHERE "deletedAt" IS NULL`,
    );

    return {
      totalSales: Number(salesResult.totalSales),
      totalPurchases: Number(purchasesResult.totalPurchases),
      totalExpenses: Number(expensesResult.totalExpenses),
      totalCustomers: Number(customersResult.totalCustomers),
      totalProducts: Number(productsResult.totalProducts),
    };
  }

  async getSalesChartData(): Promise<Array<{ date: string; total: string }>> {
    const result = await this.dataSource.query<
      Array<{ date: string; total: string }>
    >(`
      SELECT date, SUM(total) as total
      FROM sale
      WHERE status = 'COMPLETED'
      GROUP BY date
      ORDER BY date ASC
      LIMIT 30
    `);
    return result;
  }
}
