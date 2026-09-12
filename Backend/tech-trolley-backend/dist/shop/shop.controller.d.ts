import { ShopService } from './shop.service';
import { UpdateShopDto } from './dtos/update-shop.dto';
export declare class ShopController {
    private readonly shopService;
    constructor(shopService: ShopService);
    getShopSettings(): Promise<import("./entities/shop.entity").Shop>;
    updateShopSettings(updateShopDto: UpdateShopDto): Promise<import("./entities/shop.entity").Shop>;
}
