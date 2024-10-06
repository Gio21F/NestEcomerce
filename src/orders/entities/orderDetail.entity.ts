import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "src/products/entities";

@Entity('orderDetails')
export class OrderDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.details)
    order: Order;

    @ManyToOne(
        () => Product, 
        ( product ) => product.orderDetails,
        { eager: true }
    )
    product: Product;

    @Column()
    quantity: number;

    @Column()
    price_per_unit: number;

    @Column()
    size: string;

    @Column()
    subtotal: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}