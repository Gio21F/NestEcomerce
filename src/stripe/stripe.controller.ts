import { Body, Controller, Get, Header, Post, Query, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateSessionArrayDto } from './dto/create_session.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ProductsService } from 'src/products/products.service';
import { User } from 'src/auth/entities/user.entity';


@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly productService: ProductsService,
  ) {}

  @Post()
  @Auth()
  async create(
    @Body() create_session: CreateSessionArrayDto,
    @GetUser() user: User
  ) {
    const productIds: string[] = create_session.products.map(product => product.id);
    const products = await this.productService.findProductsByIds(productIds);
    const line_items = this.stripeService.createLineItems( products, create_session);
    return this.stripeService.createCheckoutSession( line_items, create_session, user.id );
  }

  @Get('checkout_session')
  @Auth()
  checkoutSession(
    @Query('session_id') session_id: string,
  ){
      return this.stripeService.checkoutSession(session_id);
  }

  @Post('webhook')
  webhook( @Req() request: Request ){
    return this.stripeService.webhook( request );
  }
}
