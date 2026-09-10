import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Product } from '../products/entities/products.entity';
import {
  InventoryStatus,
  InventoryUnit,
} from './entities/inventory-units.entity';

interface InventoryItem {
  productId: string;
  quantity: number;
  imeis?: string[];
}

export type LockedProductMap = Map<string, Product>;

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryUnit)
    private readonly inventoryRepository: Repository<InventoryUnit>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private inventoryRepo(manager?: EntityManager): Repository<InventoryUnit> {
    return manager
      ? manager.getRepository(InventoryUnit)
      : this.inventoryRepository;
  }

  private productRepo(manager?: EntityManager): Repository<Product> {
    return manager ? manager.getRepository(Product) : this.productRepository;
  }

  private aggregateQuantities(items: InventoryItem[]): Map<string, number> {
    const quantities = new Map<string, number>();

    for (const item of items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return quantities;
  }

  private async productsForItems(
    items: InventoryItem[],
    manager?: EntityManager,
    lock = false,
  ): Promise<LockedProductMap> {
    if (items.length === 0) {
      throw new BadRequestException('At least one product is required.');
    }

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(
          'Product quantities must be positive whole numbers.',
        );
      }
    }

    const productIds = [...new Set(items.map((item) => item.productId))].sort();
    const repository = this.productRepo(manager);
    const products =
      manager && lock
        ? await repository
            .createQueryBuilder('product')
            .setLock('pessimistic_write')
            .where('product.id IN (:...productIds)', { productIds })
            .orderBy('product.id', 'ASC')
            .getMany()
        : await repository.find({ where: { id: In(productIds) } });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found.`);
      }

      if (product.trackingType === 'SERIALIZED') {
        if (!item.imeis || item.imeis.length !== item.quantity) {
          throw new BadRequestException(
            `${product.name} requires exactly one IMEI for every unit.`,
          );
        }

        if (item.imeis.some((imei) => !imei.trim())) {
          throw new BadRequestException(`${product.name} has an empty IMEI.`);
        }
      } else if (item.imeis?.length) {
        throw new BadRequestException(
          `${product.name} is quantity tracked and cannot have IMEIs.`,
        );
      }
    }

    return productMap;
  }

  private collectSerializedImeis(
    items: InventoryItem[],
    products: LockedProductMap,
  ): string[] {
    const imeis: string[] = [];

    for (const item of items) {
      const product = products.get(item.productId)!;
      if (product.trackingType === 'SERIALIZED') {
        imeis.push(...(item.imeis ?? []).map((imei) => imei.trim()));
      }
    }

    if (new Set(imeis).size !== imeis.length) {
      throw new BadRequestException('Duplicate IMEIs are not allowed.');
    }

    return imeis;
  }

  async prepareSaleStock(
    items: InventoryItem[],
    manager: EntityManager,
  ): Promise<LockedProductMap> {
    const products = await this.productsForItems(items, manager, true);
    this.collectSerializedImeis(items, products);
    const requested = this.aggregateQuantities(items);

    for (const [productId, quantity] of requested) {
      const product = products.get(productId)!;
      const available = product.quantity ?? 0;

      if (!product.isActive) {
        throw new BadRequestException(`${product.name} is inactive.`);
      }
      if (available <= 0) {
        throw new BadRequestException(`${product.name} is out of stock.`);
      }
      if (quantity > available) {
        throw new BadRequestException(
          `Only ${available} units of ${product.name} are available.`,
        );
      }
    }

    return products;
  }

  async receiveStock(
    purchaseId: string | null,
    items: InventoryItem[],
    manager?: EntityManager,
  ): Promise<InventoryUnit[]> {
    const inventoryRepository = this.inventoryRepo(manager);
    const productRepository = this.productRepo(manager);
    const products = await this.productsForItems(
      items,
      manager,
      Boolean(manager),
    );
    const imeis = this.collectSerializedImeis(items, products);

    if (imeis.length > 0) {
      const existing = await inventoryRepository.find({
        where: { imei: In(imeis) },
      });
      if (existing.length > 0) {
        throw new BadRequestException(
          `IMEI ${existing[0].imei} already exists in inventory.`,
        );
      }
    }

    const units: InventoryUnit[] = [];
    for (const item of items) {
      const product = products.get(item.productId)!;

      if (product.trackingType === 'SERIALIZED') {
        for (const imei of item.imeis ?? []) {
          units.push(
            inventoryRepository.create({
              productId: item.productId,
              purchaseId: purchaseId ?? undefined,
              imei: imei.trim(),
              quantity: 1,
              status: InventoryStatus.IN_STOCK,
            }),
          );
        }
      } else {
        units.push(
          inventoryRepository.create({
            productId: item.productId,
            purchaseId: purchaseId ?? undefined,
            quantity: item.quantity,
            status: InventoryStatus.IN_STOCK,
          }),
        );
      }
    }

    const savedUnits = await inventoryRepository.save(units);
    const received = this.aggregateQuantities(items);
    const changedProducts: Product[] = [];

    for (const [productId, quantity] of received) {
      const product = products.get(productId)!;
      product.quantity = (product.quantity ?? 0) + quantity;
      changedProducts.push(product);
    }

    await productRepository.save(changedProducts);
    return savedUnits;
  }

  async checkAvailability(items: InventoryItem[]): Promise<void> {
    const products = await this.productsForItems(items);
    const requested = this.aggregateQuantities(items);

    for (const [productId, quantity] of requested) {
      const product = products.get(productId)!;
      const available = product.quantity ?? 0;
      if (!product.isActive) {
        throw new BadRequestException(`${product.name} is inactive.`);
      }
      if (available <= 0) {
        throw new BadRequestException(`${product.name} is out of stock.`);
      }
      if (quantity > available) {
        throw new BadRequestException(
          `Only ${available} units of ${product.name} are available.`,
        );
      }
    }
  }

  async issueStock(
    saleId: string,
    items: InventoryItem[],
    manager?: EntityManager,
    preparedProducts?: LockedProductMap,
  ): Promise<void> {
    const inventoryRepository = this.inventoryRepo(manager);
    const productRepository = this.productRepo(manager);
    const products =
      preparedProducts ??
      (manager
        ? await this.prepareSaleStock(items, manager)
        : await this.productsForItems(items));
    const requested = this.aggregateQuantities(items);

    if (!manager) {
      for (const [productId, quantity] of requested) {
        const product = products.get(productId)!;
        const available = product.quantity ?? 0;
        if (!product.isActive) {
          throw new BadRequestException(`${product.name} is inactive.`);
        }
        if (available <= 0) {
          throw new BadRequestException(`${product.name} is out of stock.`);
        }
        if (quantity > available) {
          throw new BadRequestException(
            `Only ${available} units of ${product.name} are available.`,
          );
        }
      }
    }

    this.collectSerializedImeis(items, products);

    for (const item of items) {
      const product = products.get(item.productId)!;

      if (product.trackingType === 'SERIALIZED') {
        for (const rawImei of item.imeis ?? []) {
          const imei = rawImei.trim();
          const unit = await inventoryRepository.findOne({
            where: { imei },
            ...(manager
              ? { lock: { mode: 'pessimistic_write' as const } }
              : {}),
          });

          if (
            !unit ||
            unit.productId !== item.productId ||
            unit.status !== InventoryStatus.IN_STOCK
          ) {
            throw new BadRequestException(
              `IMEI ${imei} is not available for ${product.name}.`,
            );
          }

          unit.status = InventoryStatus.SOLD;
          unit.saleId = saleId;
          await inventoryRepository.save(unit);
        }
      } else {
        const query = inventoryRepository
          .createQueryBuilder('unit')
          .where('unit.productId = :productId', {
            productId: item.productId,
          })
          .andWhere('unit.status = :status', {
            status: InventoryStatus.IN_STOCK,
          })
          .orderBy('unit.id', 'ASC');

        if (manager) {
          query.setLock('pessimistic_write');
        }

        const availableUnits = await query.getMany();
        let remaining = item.quantity;

        for (const unit of availableUnits) {
          if (remaining === 0) break;

          if (unit.quantity <= remaining) {
            unit.status = InventoryStatus.SOLD;
            unit.saleId = saleId;
            remaining -= unit.quantity;
            await inventoryRepository.save(unit);
          } else {
            unit.quantity -= remaining;
            await inventoryRepository.save(unit);
            const soldUnit = inventoryRepository.create({
              productId: unit.productId,
              purchaseId: unit.purchaseId,
              saleId,
              quantity: remaining,
              status: InventoryStatus.SOLD,
            });
            await inventoryRepository.save(soldUnit);
            remaining = 0;
          }
        }

        if (remaining > 0) {
          throw new BadRequestException(
            `Inventory records for ${product.name} are inconsistent with its available quantity.`,
          );
        }
      }
    }

    const changedProducts: Product[] = [];
    for (const [productId, quantity] of requested) {
      const product = products.get(productId)!;
      product.quantity -= quantity;
      changedProducts.push(product);
    }
    await productRepository.save(changedProducts);
  }

  async checkStock() {
    const units = await this.inventoryRepository.find();
    return {
      serializedInStock: units.filter(
        (unit) => unit.imei && unit.status === InventoryStatus.IN_STOCK,
      ).length,
      quantityInStock: units
        .filter(
          (unit) => !unit.imei && unit.status === InventoryStatus.IN_STOCK,
        )
        .reduce((total, unit) => total + unit.quantity, 0),
      soldUnits: units.filter((unit) => unit.status === InventoryStatus.SOLD)
        .length,
      damagedUnits: units.filter(
        (unit) => unit.status === InventoryStatus.DAMAGED,
      ).length,
    };
  }

  async searchImei(imei: string) {
    const inventoryUnit = await this.inventoryRepository.findOne({
      where: { imei },
      relations: { product: true, purchase: true, sale: true },
      withDeleted: true,
    });

    if (!inventoryUnit) {
      throw new NotFoundException(`IMEI ${imei} not found.`);
    }

    return inventoryUnit;
  }
}
