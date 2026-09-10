import { Repository, DataSource } from 'typeorm';
import { Expense } from './entities/expenses.entity';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { AccountsService } from '../accounts/accounts.service';
export declare class ExpensesService {
    private expensesRepository;
    private accountsService;
    private dataSource;
    constructor(expensesRepository: Repository<Expense>, accountsService: AccountsService, dataSource: DataSource);
    create(createExpenseDto: CreateExpenseDto): Promise<Expense>;
    findAll(): Promise<Expense[]>;
    findOne(id: string): Promise<Expense>;
    update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense>;
    remove(id: string): Promise<void>;
}
