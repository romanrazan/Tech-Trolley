import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSaleDto } from './create-sale.dto';

const customerId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';

function saleInput() {
  return {
    invoiceNumber: 'INV-TEST-1',
    date: '2026-09-08',
    discount: 0,
    vat: 0,
    items: [{ productId, quantity: 1, unitPrice: 1000 }],
  };
}

describe('CreateSaleDto customer selection', () => {
  it('accepts an existing customer only', async () => {
    const dto = plainToInstance(CreateSaleDto, { ...saleInput(), customerId });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts a valid new customer only', async () => {
    const dto = plainToInstance(CreateSaleDto, {
      ...saleInput(),
      newCustomer: {
        name: 'New Customer',
        phone: '01700000000',
        email: 'customer@example.com',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('treats a blank optional customer email as omitted', async () => {
    const dto = plainToInstance(CreateSaleDto, {
      ...saleInput(),
      newCustomer: {
        name: 'New Customer',
        phone: '01700000000',
        email: '   ',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.newCustomer?.email).toBeUndefined();
  });

  it('rejects an invalid optional customer email when provided', async () => {
    const dto = plainToInstance(CreateSaleDto, {
      ...saleInput(),
      newCustomer: {
        name: 'New Customer',
        phone: '01700000000',
        email: 'not-an-email',
      },
    });

    const errors = await validate(dto);

    expect(JSON.stringify(errors)).toContain('Enter a valid email address.');
  });

  it.each([
    { label: 'neither customer option', selection: {} },
    {
      label: 'both customer options',
      selection: {
        customerId,
        newCustomer: { name: 'New Customer', phone: '01700000000' },
      },
    },
  ])('rejects $label', async ({ selection }) => {
    const dto = plainToInstance(CreateSaleDto, {
      ...saleInput(),
      ...selection,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'customerSelection')).toBe(
      true,
    );
  });

  it('rejects blank, zero, or negative transaction values', async () => {
    const dto = plainToInstance(CreateSaleDto, {
      ...saleInput(),
      customerId,
      items: [{ productId, quantity: 0, unitPrice: 0 }],
      discount: -1,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it.each([500000, 1234.56])(
    'accepts a positive large or decimal unit price of %s',
    async (unitPrice) => {
      const dto = plainToInstance(CreateSaleDto, {
        ...saleInput(),
        customerId,
        items: [{ productId, quantity: 1, unitPrice }],
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );
});
