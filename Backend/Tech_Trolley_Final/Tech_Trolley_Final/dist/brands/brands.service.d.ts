import { Repository } from 'typeorm';
import { Brand } from './entities/brands.entity';
import { CreateBrandDto } from './dtos/create-brand.dto';
import { UpdateBrandDto } from './dtos/update-brand.dto';
export declare class BrandsService {
    private brandsRepository;
    constructor(brandsRepository: Repository<Brand>);
    create(createBrandDto: CreateBrandDto): Promise<Brand>;
    findAll(): Promise<Brand[]>;
    findOne(id: string): Promise<Brand>;
    update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand>;
    remove(id: string): Promise<void>;
}
