import { SuppliersService } from './suppliers.service';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    findAll(): Promise<import("./suppliers.service").SupplierSummary[]>;
    getDetails(id: string): Promise<import("./suppliers.service").SupplierDetails>;
    findOne(id: string): Promise<import("./entities/suppliers.entity").Supplier>;
    update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<import("./entities/suppliers.entity").Supplier>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getDues(id: string): Promise<{
        due: number;
    }>;
}
