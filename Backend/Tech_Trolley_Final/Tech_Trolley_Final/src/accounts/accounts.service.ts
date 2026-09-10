import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  Account,
  isAccountTypeCompatible,
  normalizePaymentMethod,
} from './entities/accounts.entity';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = this.accountsRepository.create(createAccountDto);
    return this.accountsRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  async findPaymentOptions(): Promise<
    Array<Pick<Account, 'id' | 'name' | 'type'>>
  > {
    return this.accountsRepository.find({
      select: { id: true, name: true, type: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const account = await this.findOne(id);
    Object.assign(account, updateAccountDto);
    return this.accountsRepository.save(account);
  }

  async updateBalance(id: string, amount: number): Promise<Account> {
    const account = await this.findOne(id);
    account.balance = Number(account.balance) + Number(amount);
    return this.accountsRepository.save(account);
  }

  /**
   * Apply a signed balance change to an account inside an EXISTING transaction.
   *
   * The caller passes its transactional EntityManager (from a QueryRunner) so
   * this balance update commits or rolls back atomically together with whatever
   * the caller is doing (e.g. saving a payment row). This is the shared core
   * used by recordInflow / recordOutflow.
   *
   * @param manager   the caller's transactional EntityManager
   * @param accountId the account whose balance is changing
   * @param signedAmount positive to increase the balance, negative to decrease
   */
  async applyBalanceChange(
    manager: EntityManager,
    accountId: string,
    signedAmount: number,
    paymentMethod?: string,
  ): Promise<Account> {
    // Read the account through the SAME transaction so the update is isolated
    // and rolls back with the caller on failure.
    const account = await manager.findOne(Account, {
      where: { id: accountId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!account) throw new NotFoundException('Financial account not found');
    if (!account.isActive) {
      throw new BadRequestException('Financial account is inactive');
    }
    if (paymentMethod) {
      const normalizedMethod = normalizePaymentMethod(paymentMethod);
      if (!normalizedMethod) {
        throw new BadRequestException('Unsupported payment method');
      }
      if (!isAccountTypeCompatible(normalizedMethod, account.type)) {
        throw new BadRequestException(
          `The selected account is not compatible with ${normalizedMethod}.`,
        );
      }
    }
    const nextBalance = Number(account.balance) + Number(signedAmount);
    if (nextBalance < 0) {
      throw new BadRequestException('Insufficient account balance');
    }
    account.balance = nextBalance;
    return manager.save(Account, account);
  }

  /**
   * Money coming IN to an account (e.g. a customer paying for a sale).
   * Increases the account balance. Runs inside the caller's transaction.
   */
  async recordInflow(
    manager: EntityManager,
    accountId: string,
    amount: number,
    paymentMethod?: string,
  ): Promise<Account> {
    if (amount <= 0) {
      throw new BadRequestException('Inflow amount must be greater than zero');
    }
    return this.applyBalanceChange(manager, accountId, amount, paymentMethod);
  }

  /**
   * Money going OUT of an account (e.g. paying a supplier for a purchase).
   * Decreases the account balance. Runs inside the caller's transaction.
   */
  async recordOutflow(
    manager: EntityManager,
    accountId: string,
    amount: number,
    paymentMethod?: string,
  ): Promise<Account> {
    if (amount <= 0) {
      throw new BadRequestException('Outflow amount must be greater than zero');
    }
    return this.applyBalanceChange(manager, accountId, -amount, paymentMethod);
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Account);
      const account = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) throw new NotFoundException('Account not found');

      if (Number(account.balance) !== 0) {
        throw new ConflictException(
          `This account cannot be deleted because its balance is ${Number(account.balance).toFixed(2)}. Transfer or adjust the balance to zero first.`,
        );
      }

      await repository.softRemove(account);
      return { message: 'Account deleted successfully.' };
    });
  }
}
