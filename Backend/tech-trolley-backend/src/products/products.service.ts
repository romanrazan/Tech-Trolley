import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Raw,
  Repository,
} from 'typeorm';
import { Product } from './entities/products.entity';
import { CreateProductDto, TrackingType } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdateProductStatusDto } from './dtos/update-product-status.dto';
import { InventoryService } from '../inventory/inventory.service';
import {
  InventoryStatus,
  InventoryUnit,
} from '../inventory/entities/inventory-units.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SaleStatus } from '../sales/entities/sale.entity';
import { PurchaseItem } from '../purchases/entities/purchase-item.entity';
import { PurchaseStatus } from '../purchases/entities/purchase.entity';
import { Brand } from '../brands/entities/brands.entity';
import { Category } from '../categories/entities/categories.entity';

export interface PurchaseProductInput {
  name: string;
  brandId: string;
  categoryId: string;
  trackingType: TrackingType;
  isActive: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (!Number.isInteger(createProductDto.quantity)) {
      throw new BadRequestException('Initial quantity must be an integer');
    }
    if (createProductDto.quantity < 0) {
      throw new BadRequestException('Initial quantity cannot be negative');
    }
    if (
      createProductDto.trackingType === TrackingType.SERIALIZED &&
      createProductDto.quantity !== 0
    ) {
      throw new BadRequestException(
        'Serialized products must start with quantity 0; add stock through Purchase with IMEIs',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const { quantity, ...productInput } = createProductDto;
      const product = manager.create(Product, {
        ...productInput,
        quantity: 0,
      });
      const savedProduct = await manager.save(Product, product);

      if (quantity > 0) {
        await this.inventoryService.receiveStock(
          null,
          [{ productId: savedProduct.id, quantity }],
          manager,
        );
        savedProduct.quantity = quantity;
      }

      return savedProduct;
    });
  }

  async createForPurchaseInTransaction(
    input: PurchaseProductInput,
    manager: EntityManager,
  ): Promise<Product> {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Product name is required');
    }
    if (typeof input.isActive !== 'boolean') {
      throw new BadRequestException('Product active status must be valid');
    }

    const [brand, category, duplicate] = await Promise.all([
      manager.getRepository(Brand).findOne({
        where: { id: input.brandId, isActive: true },
      }),
      manager.getRepository(Category).findOne({
        where: { id: input.categoryId, isActive: true },
      }),
      manager.getRepository(Product).findOne({
        where: {
          name: Raw((column) => `LOWER(${column}) = LOWER(:name)`, { name }),
        },
        withDeleted: true,
      }),
    ]);

    if (!brand) {
      throw new BadRequestException('Select an active Brand');
    }
    if (!category) {
      throw new BadRequestException('Select an active Category');
    }
    if (duplicate) {
      throw new ConflictException(
        `A Product named ${name} already exists. Select the existing Product instead.`,
      );
    }

    const repository = manager.getRepository(Product);
    return repository.save(
      repository.create({
        ...input,
        name,
        quantity: 0,
      }),
    );
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async updateStatus(
    id: string,
    updateProductStatusDto: UpdateProductStatusDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = updateProductStatusDto.isActive;
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const product = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Product not found');

      if (Number(product.quantity) > 0) {
        throw new ConflictException(
          `This product cannot be deleted because ${product.quantity} units are still in stock.`,
        );
      }

      const inventoryRepository = manager.getRepository(InventoryUnit);
      const inStockImei = await inventoryRepository.findOne({
        where: {
          productId: id,
          status: InventoryStatus.IN_STOCK,
          imei: Not(IsNull()),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (inStockImei) {
        throw new ConflictException(
          'This product cannot be deleted because it has active serialized IMEIs.',
        );
      }

      const activeSaleItem = await manager.getRepository(SaleItem).findOne({
        where: {
          productId: id,
          sale: {
            status: In([SaleStatus.IN_PROGRESS, SaleStatus.INCOMPLETE]),
          },
        },
        relations: { sale: true },
      });
      const activePurchaseItem = await manager
        .getRepository(PurchaseItem)
        .findOne({
          where: {
            productId: id,
            purchase: {
              status: In([
                PurchaseStatus.IN_PROGRESS,
                PurchaseStatus.INCOMPLETE,
              ]),
            },
          },
          relations: { purchase: true },
        });
      if (activeSaleItem || activePurchaseItem) {
        throw new ConflictException(
          'This product is connected to an active transaction.',
        );
      }

      const inStockInventory = await inventoryRepository.findOne({
        where: { productId: id, status: InventoryStatus.IN_STOCK },
        lock: { mode: 'pessimistic_write' },
      });
      if (inStockInventory) {
        throw new ConflictException(
          'This product cannot be deleted because active inventory records remain.',
        );
      }

      await repository.softRemove(product);
      return { message: 'Product deleted successfully.' };
    });
  }
}
