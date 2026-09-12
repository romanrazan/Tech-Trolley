import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dtos/create-brand.dto';
import { UpdateBrandDto } from './dtos/update-brand.dto';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    create(createBrandDto: CreateBrandDto): Promise<import("./entities/brands.entity").Brand>;
    findAll(): Promise<import("./entities/brands.entity").Brand[]>;
    findOne(id: string): Promise<import("./entities/brands.entity").Brand>;
    update(id: string, updateBrandDto: UpdateBrandDto): Promise<import("./entities/brands.entity").Brand>;
    remove(id: string): Promise<void>;
}
