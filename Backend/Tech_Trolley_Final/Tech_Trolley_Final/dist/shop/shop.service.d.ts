import { DataSource } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { UpdateShopDto } from './dtos/update-shop.dto';
export declare class ShopService {
    private dataSource;
    constructor(dataSource: DataSource);
    private getOrCreate;
    getShopSettings(): Promise<Shop>;
    updateShopSettings(updateShopDto: UpdateShopDto): Promise<Shop>;
}
