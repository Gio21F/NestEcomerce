import {
  BadRequestException,
    Injectable,
    Logger,
    UnprocessableEntityException,
  } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { CreateSessionArrayDto } from './dto/create_session.dto';
import { Product } from 'src/products/entities';
import { OrdersService } from 'src/orders/orders.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

@Injectable()
export class StripeService {
  readonly stripe    : Stripe;
  readonly staticPath: string;
  readonly nextUrl   : string;
  readonly webhook_id: string;
  constructor(
        readonly configService: ConfigService,
        private readonly orderService: OrdersService,
    ) {
        this.stripe = new Stripe(configService.get<string>('STRIPE_SECRET_KEY'));
        this.staticPath = configService.get<string>('STATIC_URL');
        this.webhook_id = configService.get<string>('STRIPE_WEBHOOK_ID')
        this.nextUrl = configService.get<string>('NEXT_URL')
    }

    async createCheckoutSession( 
      lineItems: Stripe.Checkout.SessionCreateParams.LineItem[], 
      create_session: CreateSessionArrayDto,
      user_id: string
    ): Promise<Stripe.Checkout.Session> {
      try {
        return await this.stripe.checkout.sessions.create({
          ui_mode: 'embedded',
          line_items: lineItems,
          mode: 'payment',
          metadata: {
            user_id: user_id,
            products: JSON.stringify(create_session.products)
          },
          return_url: `${this.nextUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        });
      } catch (error) {
        Logger.error('[stripeService] Error creating a payment intent');
        throw new UnprocessableEntityException('The payment intent could not be created');
      }
  }

  createLineItems(products: Product[], createSession: CreateSessionArrayDto ): Stripe.Checkout.SessionCreateParams.LineItem[] {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    createSession.products.forEach((item) => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        lineItems.push({
            price_data: {
                currency: 'USD',
                product_data: {
                    name: product.title,
                    description: product.description,
                    images: product.images.map( product => `${this.staticPath}/products/${product.filename}` )
                },
                unit_amount: product.price * 100,
            },
            quantity: item.quantity,
        });
      }
    });
    return lineItems;
  }

  async checkoutSession(session_id: string){
    try {
      const session = await this.stripe.checkout.sessions.retrieve(session_id);
      return {
        status: session.status,
        customer_email: session.customer_details.email
      }
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async webhook(request: Request) {
    try {
      const sig =  request.headers['stripe-signature'];
      let event: Stripe.Event
      event = this.stripe.webhooks.constructEvent(request.body as any, sig, this.webhook_id);
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.payment_status === 'paid') {
            // Recuperar la sesión completa, incluyendo los line_items
            const sessionDetails = await this.stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items.data.price.product'],
            });
            const orderDto: CreateOrderDto = {
              products: JSON.parse(sessionDetails.metadata.products),
              user_id: sessionDetails.metadata.user_id,
              transaction_id: sessionDetails.id,
              amount_subtotal: sessionDetails.amount_subtotal,
              amount_total: sessionDetails.amount_total,
              status: sessionDetails.status
            }
            await this.orderService.createOrder(orderDto)
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      return { received: true }
    } catch (error) {
      Logger.error('[stripeService] Error al verificar signature webhook');
      throw new BadRequestException(error); 
    }
  }
}
