import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Order } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { OrderDetail } from './entities/orderDetail.entity';
import { Product } from 'src/products/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderDetail)
        private readonly orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ){}

    async getNumberOfOrders(){
        const count = await this.orderRepository.count();
        return count;
    }

    async createOrder( createOrderDto: CreateOrderDto ): Promise<Order>{
        const queryRunner = this.dataSource.createQueryRunner();

        // Inicia transacción
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            //Verificar user
            const { user_id, ...orderdto } = createOrderDto;
            const user = await queryRunner.manager.findOne(User, { where: { id: createOrderDto.user_id } })
            if(!user) throw new InternalServerErrorException('Unexpected error, check server logs::CreateOrder'); 
            //Crear orden
            const order = queryRunner.manager.create(Order, { 
                ...orderdto, 
                user,
                amount_total: orderdto.amount_total / 100,
                amount_subtotal: orderdto.amount_subtotal / 100,
            });
            const savedOrder = await queryRunner.manager.save(order);;
    
            // Crear detalles del pedido y esperar a que todas las promesas se resuelvan
            const orderDetails: OrderDetail[] = await Promise.all(createOrderDto.products.map(async (productData) => {
                const product = await this.productRepository.findOneBy({ id: productData.id });
                if (!product) {
                    throw new BadRequestException('Algo falló al encontrar la información de los productos');
                }
    
                const orderDetail = new OrderDetail();
                orderDetail.order = savedOrder; // Relacionar el detalle con el pedido guardado
                orderDetail.product = product; // Relacionar el detalle con el producto
                orderDetail.quantity = productData.quantity;
                orderDetail.size = productData.size;
                orderDetail.price_per_unit = product.price; // Guarda el precio del producto
                orderDetail.subtotal = product.price * productData.quantity; // Calcula el subtotal
    
                return orderDetail;
            }));
    
            // Guardar todos los detalles del pedido en la base de datos
            await queryRunner.manager.save(orderDetails);

            await queryRunner.commitTransaction();
            return savedOrder;
            
        } catch (error) {
            throw new InternalServerErrorException('Unexpected error, check server logs');
        }
    }

    async getMyOrders(user: User): Promise<Order[]> {
        try {
            return await this.orderRepository.find({
                where: { user: { id: user.id } }, // Usamos el ID del usuario para encontrar las órdenes
                // relations: ['orderDetails', 'orderDetails.product'], // Cargar detalles de la orden y los productos
            });
        } catch (error) {
            throw new InternalServerErrorException('Unexpected error, check server logs');
        }
    }
}
