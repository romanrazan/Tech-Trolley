import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from './entities/accounts.entity';
import { AccountsService } from './accounts.service';

describe('AccountsService transactional outflow', () => {
  function setup(account: Account) {
    const findOne = jest.fn().mockResolvedValue(account);
    const save = jest.fn((_entity: unknown, value: Account) =>
      Promise.resolve(value),
    );
    const manager = {
      findOne,
      save,
    } as unknown as EntityManager;
    const service = new AccountsService(
      {} as Repository<Account>,
      {} as DataSource,
    );
    return { service, manager, findOne, save };
  }

  it('debits only the selected account by the paid amount', async () => {
    const account = {
      id: 'selected-account',
      balance: 200000,
      isActive: true,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordOutflow(context.manager, account.id, 60000),
    ).resolves.toMatchObject({ balance: 140000 });

    expect(context.findOne).toHaveBeenCalledWith(Account, {
      where: { id: account.id },
      lock: { mode: 'pessimistic_write' },
    });
    expect(context.save).toHaveBeenCalledTimes(1);
  });

  it('rejects insufficient balance without saving the account', async () => {
    const account = {
      id: 'selected-account',
      balance: 50,
      isActive: true,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordOutflow(context.manager, account.id, 60),
    ).rejects.toEqual(new BadRequestException('Insufficient account balance'));
    expect(context.save).not.toHaveBeenCalled();
  });

  it('rejects an inactive account without saving it', async () => {
    const account = {
      id: 'selected-account',
      balance: 200,
      isActive: false,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordOutflow(context.manager, account.id, 60),
    ).rejects.toEqual(new BadRequestException('Financial account is inactive'));
    expect(context.save).not.toHaveBeenCalled();
  });

  it.each([
    ['Cash', 'Cash'],
    ['Bank Transfer', 'Bank'],
    ['Mobile Wallet', 'Mobile Wallet'],
    ['Mobile Wallet', 'Mobile Banking'],
  ])('accepts %s with an active %s account', async (method, type) => {
    const account = {
      id: 'selected-account',
      type,
      balance: 200,
      isActive: true,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordInflow(context.manager, account.id, 60, method),
    ).resolves.toMatchObject({ balance: 260 });
  });

  it('rejects a payment method/account type mismatch without saving', async () => {
    const account = {
      id: 'selected-account',
      type: 'Cash',
      balance: 200,
      isActive: true,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordInflow(
        context.manager,
        account.id,
        60,
        'Bank Transfer',
      ),
    ).rejects.toEqual(
      new BadRequestException(
        'The selected account is not compatible with Bank Transfer.',
      ),
    );
    expect(context.save).not.toHaveBeenCalled();
  });

  it('rejects unsupported payment methods without saving', async () => {
    const account = {
      id: 'selected-account',
      type: 'Cash',
      balance: 200,
      isActive: true,
    } as Account;
    const context = setup(account);

    await expect(
      context.service.recordInflow(context.manager, account.id, 60, 'Cheque'),
    ).rejects.toEqual(new BadRequestException('Unsupported payment method'));
    expect(context.save).not.toHaveBeenCalled();
  });
});

describe('AccountsService payment options', () => {
  it('selects only the minimal fields from active accounts', async () => {
    const options = [
      { id: 'cash-id', name: 'Main Till', type: 'Cash' },
      { id: 'bank-id', name: 'Business Bank', type: 'Bank' },
    ];
    const find = jest.fn().mockResolvedValue(options);
    const service = new AccountsService(
      {
        find,
      } as unknown as Repository<Account>,
      {} as DataSource,
    );

    await expect(service.findPaymentOptions()).resolves.toEqual(options);
    expect(find).toHaveBeenCalledWith({
      select: { id: true, name: true, type: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  });
});

describe('AccountsService safe deletion', () => {
  function setupDeletion(account: Account | null) {
    const repository = {
      findOne: jest.fn().mockResolvedValue(account),
      softRemove: jest.fn().mockResolvedValue(account),
    };
    const manager = {
      getRepository: jest.fn(() => repository),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const service = new AccountsService({} as Repository<Account>, dataSource);
    return { service, repository };
  }

  it('soft-deletes a zero-balance account without touching history', async () => {
    const account = { id: 'account-id', balance: 0 } as Account;
    const context = setupDeletion(account);

    await expect(context.service.remove(account.id)).resolves.toEqual({
      message: 'Account deleted successfully.',
    });
    expect(context.repository.softRemove).toHaveBeenCalledWith(account);
  });

  it('returns conflict for a non-zero balance', async () => {
    const context = setupDeletion({ id: 'account-id', balance: 20 } as Account);

    await expect(context.service.remove('account-id')).rejects.toEqual(
      new ConflictException(
        'This account cannot be deleted because its balance is 20.00. Transfer or adjust the balance to zero first.',
      ),
    );
    expect(context.repository.softRemove).not.toHaveBeenCalled();
  });

  it('returns not found for a missing or already deleted account', async () => {
    const context = setupDeletion(null);

    await expect(context.service.remove('missing')).rejects.toEqual(
      new NotFoundException('Account not found'),
    );
  });
});
