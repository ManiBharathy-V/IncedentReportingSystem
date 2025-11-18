import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reportedBy: string;

  @Column()
  assignedTo: string;

  @Column({ type: 'datetime' })
  dateTime: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  attachment: string;

  @Column({ default: 'Open' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  closedOn: Date;

  @Column({ nullable: true })
  totalTime: string;

  @CreateDateColumn()
  createdAt: Date;
}