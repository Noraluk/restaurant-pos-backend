import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderHistory } from './order-history.entity';

@Entity({ name: 'order_history_items' })
export class OrderHistoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderHistoryId!: string;

  @ManyToOne(() => OrderHistory, (history: OrderHistory) => history.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderHistoryId' })
  orderHistory!: OrderHistory;

  @Column({ type: 'uuid', nullable: true })
  menuItemId!: string | null;

  @Column({ type: 'text' })
  nameSnapshot!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unitPriceSnapshot!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  lineTotal!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
