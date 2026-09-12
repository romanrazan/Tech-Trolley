import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { UpdateShopDto } from './dtos/update-shop.dto';
import { JwtAuthGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  getShopSettings() {
    return this.shopService.getShopSettings();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Put()
  updateShopSettings(@Body() updateShopDto: UpdateShopDto) {
    return this.shopService.updateShopSettings(updateShopDto);
  }
}
