import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,Index,} from "typeorm";
import { History } from "../../history/entities/history.entity";
import { Playlist } from "../../playlist/entities/playlist.entity";
@Entity({ name: "users" })

export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 30, nullable : false })
  username!: string;

  @Index({ unique: true })
  @Column({ length: 100, nullable : false })
  email!: string;

  @Column({ length: 60, nullable : false })
  password!: string; // hash (bcrypt / argon2)

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
  
  /* ────────── Relaciones ────────── */
  @OneToMany(() => History, (h) => h.user)
  history!: History[];
  @OneToMany(() => Playlist, (p) => p.user)
  playlist!: Playlist[];
  histories: any;
}