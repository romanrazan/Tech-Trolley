import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { JwtAuthGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SALESPERSON)
  @Get('payment-options')
  findPaymentOptions() {
    return this.accountsService.findPaymentOptions();
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.findOne(id);
  }

  @Roles(UserRole.OWNER)
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.remove(id);
  }
}
