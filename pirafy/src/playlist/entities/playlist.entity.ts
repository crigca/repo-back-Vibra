import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, Index, } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity({ name: "playlists" })
@Unique(["userId", "videoId"])

export class Playlist {
  @PrimaryGeneratedColumn()
  id!: number;

  /* ────── FK to User ────── */

  @Index()
  @Column("uuid", { nullable : false })
  userId!: string;

  @ManyToOne(() => User, (u) => u.playlist, { onDelete: "CASCADE", })
  user!: User;

  /* ────── Data ────── */

  @Column({ length: 30, nullable : false })
  videoId!: string;   // YouTube ID

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}