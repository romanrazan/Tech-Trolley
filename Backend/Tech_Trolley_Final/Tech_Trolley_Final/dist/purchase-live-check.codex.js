"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("typeorm");
const app_module_1 = require("./src/app.module");
const brands_entity_1 = require("./src/brands/entities/brands.entity");
const categories_entity_1 = require("./src/categories/entities/categories.entity");
const products_entity_1 = require("./src/products/entities/products.entity");
const create_product_dto_1 = require("./src/products/dtos/create-product.dto");
const purchases_service_1 = require("./src/purchases/purchases.service");
const suppliers_entity_1 = require("./src/suppliers/entities/suppliers.entity");
async function getCounts(dataSource) {
    const rows = (await dataSource.query(`
    SELECT 'product' AS table_name, COUNT(*)::integer AS row_count FROM product
    UNION ALL SELECT 'purchase', COUNT(*)::integer FROM purchase
    UNION ALL SELECT 'purchase_item', COUNT(*)::integer FROM purchase_item
    UNION ALL SELECT 'inventory_unit', COUNT(*)::integer FROM inventory_unit
    UNION ALL SELECT 'sale', COUNT(*)::integer FROM sale
    UNION ALL SELECT 'sale_item', COUNT(*)::integer FROM sale_item
    ORDER BY table_name
  `));
    return Object.fromEntries(rows.map((row) => [row.table_name, row.row_count]));
}
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: false,
    });
    const dataSource = app.get(typeorm_1.DataSource);
    const purchases = app.get(purchases_service_1.PurchasesService);
    const createdPurchaseIds = [];
    const createdProductIds = [];
    let existingProduct = null;
    let existingQuantityBefore = 0;
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const invoicePrefix = `CODEX-SCHEMA-CHECK-${suffix}`;
    const productPrefix = `CODEX Schema Check ${suffix}`;
    try {
        const supplier = await dataSource.getRepository(suppliers_entity_1.Supplier).findOne({
            where: { isActive: true },
        });
        existingProduct = await dataSource.getRepository(products_entity_1.Product).findOne({
            where: { isActive: true, trackingType: create_product_dto_1.TrackingType.QUANTITY },
            order: { name: 'ASC' },
        });
        const brand = await dataSource.getRepository(brands_entity_1.Brand).findOne({
            where: { isActive: true },
        });
        const category = await dataSource.getRepository(categories_entity_1.Category).findOne({
            where: { isActive: true },
        });
        if (!supplier || !existingProduct || !brand || !category) {
            throw new Error('Live verification requires an active Supplier, quantity Product, Brand, and Category');
        }
        const before = await getCounts(dataSource);
        existingQuantityBefore = Number(existingProduct.quantity);
        const date = new Date().toISOString().slice(0, 10);
        const existingPurchase = await purchases.create({
            invoiceNumber: `${invoicePrefix}-EXISTING`,
            supplierId: supplier.id,
            date,
            items: [
                {
                    productId: existingProduct.id,
                    quantity: 1,
                    unitPrice: 1,
                },
            ],
        });
        createdPurchaseIds.push(existingPurchase.id);
        const quantityPurchase = await purchases.create({
            invoiceNumber: `${invoicePrefix}-NEW-QUANTITY`,
            supplierId: supplier.id,
            date,
            items: [
                {
                    newProduct: {
                        name: `${productPrefix} Quantity`,
                        brandId: brand.id,
                        categoryId: category.id,
                        trackingType: create_product_dto_1.TrackingType.QUANTITY,
                        isActive: true,
                    },
                    quantity: 2,
                    unitPrice: 1,
                },
            ],
        });
        createdPurchaseIds.push(quantityPurchase.id);
        const serializedImeis = [
            `CODEX-${suffix}-IMEI-1`,
            `CODEX-${suffix}-IMEI-2`,
        ];
        const serializedPurchase = await purchases.create({
            invoiceNumber: `${invoicePrefix}-NEW-SERIALIZED`,
            supplierId: supplier.id,
            date,
            items: [
                {
                    newProduct: {
                        name: `${productPrefix} Serialized`,
                        brandId: brand.id,
                        categoryId: category.id,
                        trackingType: create_product_dto_1.TrackingType.SERIALIZED,
                        isActive: true,
                    },
                    quantity: 2,
                    unitPrice: 1,
                    imeis: serializedImeis,
                },
            ],
        });
        createdPurchaseIds.push(serializedPurchase.id);
        const createdProducts = (await dataSource.query('SELECT id, name, quantity, "trackingType" FROM product WHERE name LIKE $1 ORDER BY name', [`${productPrefix}%`]));
        createdProductIds.push(...createdProducts.map((product) => product.id));
        const quantityProduct = createdProducts.find((product) => product.trackingType === create_product_dto_1.TrackingType.QUANTITY);
        const serializedProduct = createdProducts.find((product) => product.trackingType === create_product_dto_1.TrackingType.SERIALIZED);
        if (!quantityProduct || Number(quantityProduct.quantity) !== 2) {
            throw new Error('New quantity Product was not incremented exactly once');
        }
        if (!serializedProduct || Number(serializedProduct.quantity) !== 2) {
            throw new Error('New serialized Product quantity is incorrect');
        }
        const inventoryChecks = (await dataSource.query(`SELECT "productId", COUNT(*)::integer AS rows,
              SUM(quantity)::integer AS units,
              COUNT(imei)::integer AS imeis
       FROM inventory_unit
       WHERE "purchaseId" = ANY($1::uuid[])
       GROUP BY "productId"`, [createdPurchaseIds]));
        const quantityInventory = inventoryChecks.find((row) => row.productId === quantityProduct.id);
        const serializedInventory = inventoryChecks.find((row) => row.productId === serializedProduct.id);
        if (!quantityInventory ||
            quantityInventory.rows !== 1 ||
            quantityInventory.units !== 2 ||
            quantityInventory.imeis !== 0) {
            throw new Error('Quantity inventory record is incorrect');
        }
        if (!serializedInventory ||
            serializedInventory.rows !== 2 ||
            serializedInventory.units !== 2 ||
            serializedInventory.imeis !== 2) {
            throw new Error('Serialized inventory/IMEI records are incorrect');
        }
        const existingAfter = await dataSource.getRepository(products_entity_1.Product).findOneByOrFail({
            id: existingProduct.id,
        });
        if (Number(existingAfter.quantity) !== existingQuantityBefore + 1) {
            throw new Error('Existing Product quantity was not incremented once');
        }
        const rollbackCounts = await getCounts(dataSource);
        let rollbackMessage = '';
        try {
            await purchases.create({
                invoiceNumber: `${invoicePrefix}-ROLLBACK`,
                supplierId: supplier.id,
                date,
                items: [
                    {
                        newProduct: {
                            name: `${productPrefix} Rollback`,
                            brandId: brand.id,
                            categoryId: category.id,
                            trackingType: create_product_dto_1.TrackingType.SERIALIZED,
                            isActive: true,
                        },
                        quantity: 2,
                        unitPrice: 1,
                        imeis: [`CODEX-${suffix}-DUPLICATE`, `CODEX-${suffix}-DUPLICATE`],
                    },
                ],
            });
            throw new Error('Rollback verification unexpectedly created a purchase');
        }
        catch (error) {
            rollbackMessage = error instanceof Error ? error.message : String(error);
            if (!rollbackMessage.includes('Duplicate IMEIs'))
                throw error;
        }
        const afterRollbackCounts = await getCounts(dataSource);
        const rolledBackRows = (await dataSource.query(`SELECT
         (SELECT COUNT(*)::integer FROM product WHERE name = $1) AS products,
         (SELECT COUNT(*)::integer FROM purchase WHERE "invoiceNumber" = $2) AS purchases`, [`${productPrefix} Rollback`, `${invoicePrefix}-ROLLBACK`]));
        if (JSON.stringify(rollbackCounts) !== JSON.stringify(afterRollbackCounts) ||
            rolledBackRows[0].products !== 0 ||
            rolledBackRows[0].purchases !== 0) {
            throw new Error('Failed Purchase did not roll back completely');
        }
        const activeProducts = await dataSource.getRepository(products_entity_1.Product).find();
        if (activeProducts.some((product) => product.deletedAt !== null)) {
            throw new Error('Normal Product listing included a soft-deleted Product');
        }
        console.log(JSON.stringify({
            existingProductPurchase: 'passed',
            newQuantityProductPurchase: 'passed',
            newSerializedProductPurchase: 'passed',
            serializedUniqueImeiCount: serializedImeis.length,
            failedPurchaseRollback: 'passed',
            rollbackReason: rollbackMessage,
            softDeleteFiltering: 'passed',
            businessCountsBefore: before,
        }, null, 2));
    }
    finally {
        if (createdPurchaseIds.length > 0 || createdProductIds.length > 0) {
            await dataSource.transaction(async (manager) => {
                if (createdPurchaseIds.length > 0) {
                    await manager.query('DELETE FROM inventory_unit WHERE "purchaseId" = ANY($1::uuid[])', [createdPurchaseIds]);
                    await manager.query('DELETE FROM purchase_item WHERE "purchaseId" = ANY($1::uuid[])', [createdPurchaseIds]);
                    await manager.query('DELETE FROM purchase WHERE id = ANY($1::uuid[])', [createdPurchaseIds]);
                }
                if (existingProduct) {
                    await manager.query('UPDATE product SET quantity = $1 WHERE id = $2', [existingQuantityBefore, existingProduct.id]);
                }
                if (createdProductIds.length > 0) {
                    await manager.query('DELETE FROM product WHERE id = ANY($1::uuid[])', [
                        createdProductIds,
                    ]);
                }
            });
        }
        const leftovers = (await dataSource.query(`SELECT
         (SELECT COUNT(*)::integer FROM product WHERE name LIKE $1) AS products,
         (SELECT COUNT(*)::integer FROM purchase WHERE "invoiceNumber" LIKE $2) AS purchases`, [`${productPrefix}%`, `${invoicePrefix}%`]));
        console.log(JSON.stringify({ cleanup: leftovers[0] }, null, 2));
        await app.close();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=purchase-live-check.codex.js.map