import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  controllers: [StripeController],
  providers: [StripeService],
  imports: [
    ConfigModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
  ]
})
export class StripeModule {}
