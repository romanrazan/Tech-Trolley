"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const node_crypto_1 = require("node:crypto");
const typeorm_1 = require("typeorm");
const accounts_entity_1 = require("./src/accounts/entities/accounts.entity");
const accounts_service_1 = require("./src/accounts/accounts.service");
const app_module_1 = require("./src/app.module");
const brands_entity_1 = require("./src/brands/entities/brands.entity");
const categories_entity_1 = require("./src/categories/entities/categories.entity");
const customers_entity_1 = require("./src/customers/entities/customers.entity");
const customers_service_1 = require("./src/customers/customers.service");
const expenses_entity_1 = require("./src/expenses/entities/expenses.entity");
const expenses_service_1 = require("./src/expenses/expenses.service");
const inventory_units_entity_1 = require("./src/inventory/entities/inventory-units.entity");
const inventory_service_1 = require("./src/inventory/inventory.service");
const products_entity_1 = require("./src/products/entities/products.entity");
const products_service_1 = require("./src/products/products.service");
const purchase_item_entity_1 = require("./src/purchases/entities/purchase-item.entity");
const purchase_payment_entity_1 = require("./src/purchases/entities/purchase-payment.entity");
const purchase_entity_1 = require("./src/purchases/entities/purchase.entity");
const purchases_service_1 = require("./src/purchases/purchases.service");
const sale_item_entity_1 = require("./src/sales/entities/sale-item.entity");
const sale_payment_entity_1 = require("./src/sales/entities/sale-payment.entity");
const sale_entity_1 = require("./src/sales/entities/sale.entity");
const sales_service_1 = require("./src/sales/sales.service");
const suppliers_entity_1 = require("./src/suppliers/entities/suppliers.entity");
const suppliers_service_1 = require("./src/suppliers/suppliers.service");
const users_entity_1 = require("./src/users/entities/users.entity");
async function expectConflict(label, operation, messagePart) {
    try {
        await operation();
        throw new Error(`${label} unexpectedly succeeded`);
    }
    catch (error) {
        if (!(error instanceof common_1.ConflictException))
            throw error;
        if (!error.message.includes(messagePart)) {
            throw new Error(`${label} returned the wrong message: ${error.message}`);
        }
        console.log(`PASS ${label}: 409 ${error.message}`);
    }
}
async function run() {
    const context = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: false,
    });
    const dataSource = context.get(typeorm_1.DataSource);
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
        const manager = runner.manager;
        const transactionalDataSource = {
            transaction: (work) => work(manager),
            query: (sql, parameters) => manager.query(sql, parameters),
            getRepository: manager.getRepository.bind(manager),
        };
        const [brand] = await manager.getRepository(brands_entity_1.Brand).find({ take: 1 });
        const [category] = await manager.getRepository(categories_entity_1.Category).find({ take: 1 });
        const [user] = await manager.getRepository(users_entity_1.User).find({ take: 1 });
        if (!brand || !category || !user) {
            throw new Error('Manual verification requires one brand, category, and user');
        }
        const token = (0, node_crypto_1.randomUUID)().replaceAll('-', '');
        const productRepository = manager.getRepository(products_entity_1.Product);
        const customerRepository = manager.getRepository(customers_entity_1.Customer);
        const supplierRepository = manager.getRepository(suppliers_entity_1.Supplier);
        const accountRepository = manager.getRepository(accounts_entity_1.Account);
        const product = await productRepository.save(productRepository.create({
            name: `Safe delete product ${token}`,
            brandId: brand.id,
            categoryId: category.id,
            trackingType: 'SERIALIZED',
            quantity: 0,
            isActive: true,
        }));
        const customer = await customerRepository.save(customerRepository.create({
            name: `Safe delete customer ${token}`,
            phone: `manual-${token}`,
            email: `customer-${token}@example.invalid`,
            isActive: true,
        }));
        const supplier = await supplierRepository.save(supplierRepository.create({
            name: `Safe delete supplier ${token}`,
            phone: `supplier-${token}`,
            email: `supplier-${token}@example.invalid`,
            address: 'Rollback-only fixture',
            isActive: true,
        }));
        const account = await accountRepository.save(accountRepository.create({
            name: `Safe delete account ${token}`,
            type: 'Cash',
            balance: 0,
            isActive: true,
        }));
        const sale = await manager.getRepository(sale_entity_1.Sale).save({
            invoiceNumber: `MANUAL-SALE-${token}`,
            customerId: customer.id,
            salespersonId: user.id,
            date: '2026-09-10',
            subTotal: 100,
            discount: 0,
            vat: 0,
            total: 100,
            status: sale_entity_1.SaleStatus.COMPLETED,
        });
        await manager.getRepository(sale_item_entity_1.SaleItem).save({
            saleId: sale.id,
            productId: product.id,
            quantity: 1,
            unitPrice: 100,
            imeis: [`manual-${token}`],
        });
        await manager.getRepository(sale_payment_entity_1.SalePayment).save({
            saleId: sale.id,
            accountId: account.id,
            amount: 100,
            paymentMethod: 'Cash',
            transactionId: null,
            date: '2026-09-10',
        });
        const purchase = await manager.getRepository(purchase_entity_1.Purchase).save({
            invoiceNumber: `MANUAL-PURCHASE-${token}`,
            supplierId: supplier.id,
            date: '2026-09-10',
            total: 100,
            status: purchase_entity_1.PurchaseStatus.COMPLETED,
            remarks: 'Rollback-only fixture',
        });
        await manager.getRepository(purchase_item_entity_1.PurchaseItem).save({
            purchaseId: purchase.id,
            productId: product.id,
            quantity: 1,
            unitPrice: 100,
            imeis: [`manual-${token}`],
        });
        await manager.getRepository(purchase_payment_entity_1.PurchasePayment).save({
            purchaseId: purchase.id,
            accountId: account.id,
            amount: 100,
            paymentMethod: 'Cash',
            transactionId: null,
            date: '2026-09-10',
        });
        await manager.getRepository(inventory_units_entity_1.InventoryUnit).save({
            productId: product.id,
            imei: `manual-${token}`,
            quantity: 1,
            status: inventory_units_entity_1.InventoryStatus.SOLD,
            purchaseId: purchase.id,
            saleId: sale.id,
        });
        const expense = await manager.getRepository(expenses_entity_1.Expense).save({
            category: 'Rollback-only verification',
            amount: 25,
            accountId: account.id,
            date: '2026-09-10',
            remarks: 'Rollback-only fixture',
        });
        const inventoryService = new inventory_service_1.InventoryService(manager.getRepository(inventory_units_entity_1.InventoryUnit), productRepository);
        const accountsService = new accounts_service_1.AccountsService(accountRepository, transactionalDataSource);
        const customersService = new customers_service_1.CustomersService(customerRepository, transactionalDataSource);
        const suppliersService = new suppliers_service_1.SuppliersService(supplierRepository, transactionalDataSource);
        const productsService = new products_service_1.ProductsService(productRepository, inventoryService, transactionalDataSource);
        await productsService.remove(product.id);
        await customersService.remove(customer.id);
        await suppliersService.remove(supplier.id);
        await accountsService.remove(account.id);
        for (const [label, repository, id] of [
            ['Product', productRepository, product.id],
            ['Customer', customerRepository, customer.id],
            ['Supplier', supplierRepository, supplier.id],
            ['Account', accountRepository, account.id],
        ]) {
            const active = await repository.findOne({ where: { id } });
            const archived = await repository.findOne({
                where: { id },
                withDeleted: true,
            });
            if (active || !archived?.deletedAt) {
                throw new Error(`${label} archive visibility verification failed`);
            }
            console.log(`PASS ${label}: archived and excluded from active queries`);
        }
        const salesService = new sales_service_1.SalesService(manager.getRepository(sale_entity_1.Sale), manager.getRepository(sale_item_entity_1.SaleItem), manager.getRepository(sale_payment_entity_1.SalePayment), inventoryService, accountsService, customersService, transactionalDataSource);
        const purchasesService = new purchases_service_1.PurchasesService(manager.getRepository(purchase_entity_1.Purchase), manager.getRepository(purchase_item_entity_1.PurchaseItem), manager.getRepository(purchase_payment_entity_1.PurchasePayment), inventoryService, accountsService, suppliersService, transactionalDataSource);
        const expensesService = new expenses_service_1.ExpensesService(manager.getRepository(expenses_entity_1.Expense), accountsService, transactionalDataSource);
        const saleDetails = await salesService.findOne(sale.id);
        const purchaseDetails = await purchasesService.findOne(purchase.id);
        const expenseDetails = await expensesService.findOne(expense.id);
        const inventoryDetails = await inventoryService.searchImei(`manual-${token}`);
        if (saleDetails.sale.customer?.name !== customer.name ||
            saleDetails.items[0]?.product?.name !== product.name ||
            saleDetails.payments[0]?.account?.name !== account.name ||
            purchaseDetails.purchase.supplier?.name !== supplier.name ||
            purchaseDetails.items[0]?.product?.name !== product.name ||
            purchaseDetails.payments[0]?.account?.name !== account.name ||
            expenseDetails.account?.name !== account.name ||
            inventoryDetails.product?.name !== product.name) {
            throw new Error('Historical relation visibility verification failed');
        }
        console.log('PASS historical Sale/Purchase/Payment/Expense/IMEI names retained');
        const stockedProduct = await productRepository.save(productRepository.create({
            name: `Stocked product ${token}`,
            brandId: brand.id,
            categoryId: category.id,
            trackingType: 'QUANTITY',
            quantity: 5,
            isActive: true,
        }));
        await expectConflict('Product with stock', () => productsService.remove(stockedProduct.id), '5 units are still in stock');
        const dueCustomer = await customerRepository.save(customerRepository.create({
            name: `Due customer ${token}`,
            phone: `due-customer-${token}`,
            isActive: true,
        }));
        await manager.getRepository(sale_entity_1.Sale).save({
            invoiceNumber: `DUE-SALE-${token}`,
            customerId: dueCustomer.id,
            salespersonId: user.id,
            date: '2026-09-10',
            subTotal: 15000,
            discount: 0,
            vat: 0,
            total: 15000,
            status: sale_entity_1.SaleStatus.COMPLETED,
        });
        await expectConflict('Customer with due', () => customersService.remove(dueCustomer.id), '15000.00 is still due');
        const dueSupplier = await supplierRepository.save(supplierRepository.create({
            name: `Due supplier ${token}`,
            phone: `due-supplier-${token}`,
            email: `due-supplier-${token}@example.invalid`,
            address: 'Rollback-only fixture',
            isActive: true,
        }));
        await manager.getRepository(purchase_entity_1.Purchase).save({
            invoiceNumber: `DUE-PURCHASE-${token}`,
            supplierId: dueSupplier.id,
            date: '2026-09-10',
            total: 25000,
            status: purchase_entity_1.PurchaseStatus.COMPLETED,
            remarks: null,
        });
        await expectConflict('Supplier with due', () => suppliersService.remove(dueSupplier.id), '25000.00 is still due');
        const fundedAccount = await accountRepository.save(accountRepository.create({
            name: `Funded account ${token}`,
            type: 'Cash',
            balance: 20000,
            isActive: true,
        }));
        await expectConflict('Account with balance', () => accountsService.remove(fundedAccount.id), 'balance is 20000.00');
    }
    finally {
        await runner.rollbackTransaction();
        await runner.release();
        await context.close();
        console.log('PASS rollback: no verification fixtures persisted');
    }
}
void run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=manual-safe-delete.verify.js.map