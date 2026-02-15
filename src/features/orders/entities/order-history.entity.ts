import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderHistoryItem } from './order-history-item.entity';

@Entity({ name: 'order_history' })
export class OrderHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  orderId!: string;

  @Column({ type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ type: 'text', nullable: true })
  lineUserId!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total!: string;

  @Column({ type: 'timestamptz' })
  orderedAt!: Date;

  @OneToMany(() => OrderHistoryItem, (item: OrderHistoryItem) => item.orderHistory, {
    cascade: ['insert'],
  })
  items!: OrderHistoryItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
