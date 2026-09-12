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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const brands_entity_1 = require("./entities/brands.entity");
let BrandsService = class BrandsService {
    brandsRepository;
    constructor(brandsRepository) {
        this.brandsRepository = brandsRepository;
    }
    async create(createBrandDto) {
        const existing = await this.brandsRepository.findOne({ where: { name: createBrandDto.name } });
        if (existing)
            throw new common_1.ConflictException('Brand already exists');
        const brand = this.brandsRepository.create(createBrandDto);
        return this.brandsRepository.save(brand);
    }
    async findAll() {
        return this.brandsRepository.find();
    }
    async findOne(id) {
        const brand = await this.brandsRepository.findOne({ where: { id } });
        if (!brand)
            throw new common_1.NotFoundException('Brand not found');
        return brand;
    }
    async update(id, updateBrandDto) {
        const brand = await this.findOne(id);
        if (updateBrandDto.name !== brand.name) {
            const existing = await this.brandsRepository.findOne({ where: { name: updateBrandDto.name } });
            if (existing)
                throw new common_1.ConflictException('Brand name already exists');
        }
        Object.assign(brand, updateBrandDto);
        return this.brandsRepository.save(brand);
    }
    async remove(id) {
        const brand = await this.findOne(id);
        await this.brandsRepository.remove(brand);
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(brands_entity_1.Brand)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BrandsService);
//# sourceMappingURL=brands.service.js.map