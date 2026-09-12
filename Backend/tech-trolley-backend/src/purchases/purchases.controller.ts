import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { AddPurchasePaymentDto } from './dtos/add-payment.dto';
import { JwtAuthGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post()
  @ApiOperation({
    summary: 'Create a purchase',
    description:
      'Creates an IN_PROGRESS purchase, records the purchase items, and receives ' +
      'stock into inventory in a single transaction. The total is computed by ' +
      'the server from the line items.',
  })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiCreatedResponse({ description: 'Purchase created and stock received.' })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token.' })
  @ApiForbiddenResponse({ description: 'Insufficient role.' })
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get()
  @ApiOperation({ summary: 'List all purchases' })
  @ApiOkResponse({ description: 'Array of purchases.' })
  findAll() {
    return this.purchasesService.findAll();
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase with its items and payments' })
  @ApiParam({ name: 'id', description: 'Purchase UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Purchase, its items, and its payments.' })
  @ApiNotFoundResponse({ description: 'Purchase not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post(':id/payments')
  @ApiOperation({
    summary: 'Record a purchase payment (supplier outflow)',
    description:
      'Records a payment to the supplier against the purchase AND debits the ' +
      'chosen financial account (outflow) in a single database transaction. ' +
      'If the account is missing or inactive, nothing is saved (full ' +
      'rollback). The same transaction activates a pending supplier and updates ' +
      'the purchase status from persisted payment totals.',
  })
  @ApiParam({
    name: 'id',
    description: 'Purchase UUID to pay against',
    format: 'uuid',
  })
  @ApiBody({
    type: AddPurchasePaymentDto,
    examples: {
      bank: {
        summary: 'Bank transfer payment',
        value: {
          amount: 50000,
          paymentMethod: 'Bank Transfer',
          accountId: 'a3f1c2d4-5678-4abc-9def-0123456789ab',
          transactionId: 'TXN987654321',
          date: '2026-07-26',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Payment recorded and account balance decreased.',
  })
  @ApiBadRequestResponse({
    description:
      'Validation error, purchase completed/cancelled, overpayment, or the ' +
      'financial account is missing/inactive (transaction rolled back).',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token.' })
  @ApiForbiddenResponse({ description: 'Insufficient role.' })
  @ApiNotFoundResponse({ description: 'Purchase not found.' })
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: AddPurchasePaymentDto,
  ) {
    return this.purchasesService.addPayment(id, paymentDto);
  }
}
