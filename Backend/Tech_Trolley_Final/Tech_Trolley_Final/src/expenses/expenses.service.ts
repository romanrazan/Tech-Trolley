import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense } from './entities/expenses.entity';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    private accountsService: AccountsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create an expense AND debit the paying account in a SINGLE database
   * transaction. If the account is missing or inactive, nothing is saved
   * (full rollback) — no orphan expense rows.
   */
  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expense = queryRunner.manager.create(Expense, createExpenseDto);
      const savedExpense = await queryRunner.manager.save(expense);

      await this.accountsService.recordOutflow(
        queryRunner.manager,
        createExpenseDto.accountId,
        createExpenseDto.amount,
      );

      await queryRunner.commitTransaction();
      return savedExpense;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Expense[]> {
    return this.expensesRepository.find({
      relations: { account: true },
      withDeleted: true,
    });
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id },
      relations: { account: true },
      withDeleted: true,
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  /**
   * Update an expense and re-adjust the affected account balance(s) in the
   * SAME transaction. Handles both a changed amount and a changed account.
   */
  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (expense.accountId !== updateExpenseDto.accountId) {
        // Refund the old account, then debit the new one.
        await this.accountsService.applyBalanceChange(
          queryRunner.manager,
          expense.accountId,
          Number(expense.amount),
        );
        await this.accountsService.recordOutflow(
          queryRunner.manager,
          updateExpenseDto.accountId,
          updateExpenseDto.amount,
        );
      } else {
        const difference =
          Number(updateExpenseDto.amount) - Number(expense.amount);
        if (difference !== 0) {
          await this.accountsService.applyBalanceChange(
            queryRunner.manager,
            expense.accountId,
            -difference,
          );
        }
      }

      Object.assign(expense, updateExpenseDto);
      const savedExpense = await queryRunner.manager.save(Expense, expense);

      await queryRunner.commitTransaction();
      return savedExpense;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete an expense and refund its amount to the account atomically.
   */
  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.accountsService.applyBalanceChange(
        queryRunner.manager,
        expense.accountId,
        Number(expense.amount),
      );
      await queryRunner.manager.remove(Expense, expense);

      await queryRunner.commitTransaction();
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
