import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity({ name: 'user_credentials' })
export class UserCredentials {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Contraseña hasheada (bcrypt)
  @Column()
  password!: string;

  // Verificación de email
  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  verificationCode?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpires?: Date;

  // Reset de contraseña
  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
