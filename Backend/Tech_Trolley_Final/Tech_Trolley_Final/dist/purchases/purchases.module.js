"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const purchases_service_1 = require("./purchases.service");
const purchases_controller_1 = require("./purchases.controller");
const purchase_entity_1 = require("./entities/purchase.entity");
const purchase_item_entity_1 = require("./entities/purchase-item.entity");
const purchase_payment_entity_1 = require("./entities/purchase-payment.entity");
const inventory_module_1 = require("../inventory/inventory.module");
const accounts_module_1 = require("../accounts/accounts.module");
const suppliers_module_1 = require("../suppliers/suppliers.module");
const products_module_1 = require("../products/products.module");
let PurchasesModule = class PurchasesModule {
};
exports.PurchasesModule = PurchasesModule;
exports.PurchasesModule = PurchasesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([purchase_entity_1.Purchase, purchase_item_entity_1.PurchaseItem, purchase_payment_entity_1.PurchasePayment]),
            inventory_module_1.InventoryModule,
            accounts_module_1.AccountsModule,
            suppliers_module_1.SuppliersModule,
            products_module_1.ProductsModule,
        ],
        controllers: [purchases_controller_1.PurchasesController],
        providers: [purchases_service_1.PurchasesService],
        exports: [purchases_service_1.PurchasesService],
    })
], PurchasesModule);
//# sourceMappingURL=purchases.module.js.map