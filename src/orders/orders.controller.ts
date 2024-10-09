import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('mine')
  @Auth()
  getMyOrders( @GetUser() user: User ) {
    return this.ordersService.getMyOrders(user);
  }
}
