import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(createExpenseDto: CreateExpenseDto): Promise<import("./entities/expenses.entity").Expense>;
    findAll(): Promise<import("./entities/expenses.entity").Expense[]>;
    findOne(id: string): Promise<import("./entities/expenses.entity").Expense>;
    update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<import("./entities/expenses.entity").Expense>;
    remove(id: string): Promise<void>;
}
