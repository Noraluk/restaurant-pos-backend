import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', default: 'PENDING' })
  status!: OrderStatus;

  @Column({ type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ type: 'text', nullable: true })
  lineUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  total!: string;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order, {
    cascade: ['insert'],
  })
  items!: OrderItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
