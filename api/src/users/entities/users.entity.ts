import { UserHistory } from 'src/user-history/entities/user-history.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  username!: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  // ✅ Imagen de perfil (de Google o personalizada)
  @Column({ nullable: true })
  profileImage?: string;

  // ✅ Configuración de privacidad
  @Column({
    type: 'enum',
    enum: ['public', 'private', 'followers', 'followed', 'mutuals'],
    default: 'public',
  })
  privacy!: 'public' | 'private' | 'followers' | 'followed' | 'mutuals';

  // ✅ Seguidores
  @ManyToMany(() => User, user => user.following)
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'follower_id' },
  })
  followers!: User[];

  // ✅ Seguidos
  @ManyToMany(() => User, user => user.followers)
  following!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserHistory, uh => uh.user)
  historyEntries!: UserHistory[];
}
