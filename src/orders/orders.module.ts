import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderDetail } from './entities/orderDetail.entity';
import { Order } from './entities/order.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ProductsModule } from 'src/products/products.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { Product } from 'src/products/entities';
import { User } from 'src/auth/entities/user.entity';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ Order, OrderDetail, Product, User ]),
    AuthModule,
  ],
  exports: [OrdersService]
})
export class OrdersModule {}
