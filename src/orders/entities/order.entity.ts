import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderDetail } from "./orderDetail.entity";
import { User } from "src/auth/entities/user.entity";

@Entity('orders')
export class Order {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(
        () => User,
        ( user ) => user.orders,
        { eager: true }
    )
    user: User

    @Column()
    amount_subtotal: number;

    @Column()
    amount_total: number;

    @Column()
    status: string;

    @Column()
    transaction_id: string;

    @OneToMany(
        () => OrderDetail, 
        (orderDetail) => orderDetail.order,
        { eager: true }
    )
    details: OrderDetail[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

}