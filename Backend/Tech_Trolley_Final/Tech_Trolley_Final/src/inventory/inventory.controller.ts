import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwtGuard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  checkStock() {
    return this.inventoryService.checkStock();
  }

  @Get('imeis/:imei')
  searchImei(@Param('imei') imei: string) {
    return this.inventoryService.searchImei(imei);
  }
}
