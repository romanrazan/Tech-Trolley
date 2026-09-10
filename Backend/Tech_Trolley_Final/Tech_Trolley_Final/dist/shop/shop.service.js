"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("./entities/shop.entity");
const INITIAL_SHOP = {
    name: 'Tech Trolley',
    address: 'House 12, Road 5, Block C\nBashundhara R/A, Dhaka 1229',
    phone: '+880 1712 345 678',
    currency: 'BDT',
};
let ShopService = class ShopService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getOrCreate(manager) {
        await manager.query('SELECT pg_advisory_xact_lock(847674731)');
        const repository = manager.getRepository(shop_entity_1.Shop);
        const [existing] = await repository.find({ order: { id: 'ASC' }, take: 1 });
        if (existing)
            return existing;
        return repository.save(repository.create(INITIAL_SHOP));
    }
    async getShopSettings() {
        return this.dataSource.transaction((manager) => this.getOrCreate(manager));
    }
    async updateShopSettings(updateShopDto) {
        return this.dataSource.transaction(async (manager) => {
            const shop = await this.getOrCreate(manager);
            const repository = manager.getRepository(shop_entity_1.Shop);
            return repository.save(repository.merge(shop, updateShopDto));
        });
    }
};
exports.ShopService = ShopService;
exports.ShopService = ShopService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], ShopService);
//# sourceMappingURL=shop.service.js.map