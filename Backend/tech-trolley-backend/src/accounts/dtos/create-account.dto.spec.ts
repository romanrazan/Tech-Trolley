import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

describe('CreateAccountDto validation', () => {
  it('returns the required account name message for blank input', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: '   ',
      type: 'Cash',
      balance: 0,
    });

    const errors = await validate(dto);

    expect(JSON.stringify(errors)).toContain('Account name is required.');
  });

  it.each([0, 1234.56, 500000])(
    'accepts an opening balance of %s',
    async (balance) => {
      const dto = plainToInstance(CreateAccountDto, {
        name: 'Main account',
        type: 'Cash',
        balance,
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it('rejects a negative opening balance', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: 'Main account',
      type: 'Cash',
      balance: -1,
    });

    const errors = await validate(dto);

    expect(JSON.stringify(errors)).toContain(
      'Opening balance cannot be negative.',
    );
  });
});
