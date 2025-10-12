import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity';

export enum PlotStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  TRANSFERRED = 'transferred',
}

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plotNumber: string;

  @Column('decimal', { precision: 5, scale: 2 })
  sizeMarla: number;

  @Column('decimal', { precision: 8, scale: 2 })
  sizeSqm: number;

  @Column()
  phase: string;

  @Column()
  block: string;

  @Column('decimal', { precision: 12, scale: 2 })
  pricePkr: number;

  @Column({
    type: 'varchar',
    enum: PlotStatus,
    default: PlotStatus.AVAILABLE,
  })
  status: PlotStatus;

  @Column('text')
  coordinates: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  mapX: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  mapY: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.plot)
  bookings: Booking[];

  @OneToMany('Document', 'plot')
  documents: any[];
} 