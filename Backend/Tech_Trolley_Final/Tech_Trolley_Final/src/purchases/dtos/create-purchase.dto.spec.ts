import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePurchaseDto } from './create-purchase.dto';

const supplierId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const newProduct = {
  name: 'New Product',
  brandId: '33333333-3333-4333-8333-333333333333',
  categoryId: '44444444-4444-4444-8444-444444444444',
  trackingType: 'QUANTITY',
  isActive: true,
};

describe('CreatePurchaseDto product items', () => {
  it.each([1000, 500000, 1234.56])(
    'accepts productId with a positive unit price of %s',
    async (unitPrice) => {
      const dto = plainToInstance(CreatePurchaseDto, {
        invoiceNumber: 'PUR-TEST-1',
        supplierId,
        date: '2026-09-08',
        items: [{ productId, quantity: 1, unitPrice }],
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it.each([0, -1, Number.NaN])(
    'rejects an invalid unit price of %s',
    async (unitPrice) => {
      const dto = plainToInstance(CreatePurchaseDto, {
        invoiceNumber: 'PUR-TEST-1',
        supplierId,
        date: '2026-09-08',
        items: [{ productId, quantity: 1, unitPrice }],
      });

      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );

  it('accepts a new inline supplier instead of supplierId', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      invoiceNumber: 'PUR-TEST-2',
      newSupplier: {
        name: 'New Supplier',
        phone: '01700000001',
        email: 'supplier@example.com',
        address: 'Dhaka',
      },
      date: '2026-09-10',
      items: [{ productId, quantity: 1, unitPrice: 1000 }],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts new Product details instead of productId', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      invoiceNumber: 'PUR-TEST-NEW-PRODUCT',
      supplierId,
      date: '2026-09-10',
      items: [{ newProduct, quantity: 2, unitPrice: 1000 }],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('normalizes a blank legacy productId away for a new Product item', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      invoiceNumber: 'PUR-TEST-BLANK-PRODUCT-ID',
      supplierId,
      date: '2026-09-10',
      items: [{ productId: '', newProduct, quantity: 2, unitPrice: 1000 }],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.items[0].productId).toBeUndefined();
  });

  it('still requires a UUID when an item does not provide new Product details', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      invoiceNumber: 'PUR-TEST-EXISTING-PRODUCT',
      supplierId,
      date: '2026-09-10',
      items: [{ productId: 'not-a-uuid', quantity: 1, unitPrice: 1000 }],
    });

    const errors = await validate(dto);
    expect(JSON.stringify(errors)).toContain('productId must be a UUID');
  });

  it.each([{}, { productId, newProduct }])(
    'rejects non-exclusive Product input %#',
    async (productInput) => {
      const dto = plainToInstance(CreatePurchaseDto, {
        invoiceNumber: 'PUR-TEST-PRODUCT-XOR',
        supplierId,
        date: '2026-09-10',
        items: [{ ...productInput, quantity: 1, unitPrice: 1000 }],
      });

      const errors = await validate(dto);
      const itemErrors = errors.find((error) => error.property === 'items');
      expect(JSON.stringify(itemErrors)).toContain('productSelection');
    },
  );

  it.each([
    {},
    {
      supplierId,
      newSupplier: {
        name: 'New Supplier',
        phone: '01700000001',
        email: 'supplier@example.com',
        address: 'Dhaka',
      },
    },
  ])('rejects non-exclusive supplier input %#', async (supplierInput) => {
    const dto = plainToInstance(CreatePurchaseDto, {
      invoiceNumber: 'PUR-TEST-3',
      ...supplierInput,
      date: '2026-09-10',
      items: [{ productId, quantity: 1, unitPrice: 1000 }],
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'supplierSelection')).toBe(
      true,
    );
  });
});
