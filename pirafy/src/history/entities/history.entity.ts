import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, } from "typeorm";
import { User } from "../../users/entities/user.entity";
export enum HistoryType {
  VIDEO = "video",
  IMAGE = "image",
}

@Entity({ name: "history" })
export class History {
  @PrimaryGeneratedColumn()
  id!: number;

  /* ────── FK to User ────── */
  @Index()
  @Column("uuid", { nullable : false })
  userId!: string;

  @ManyToOne(() => User, (u) => u.histories, {
    onDelete: "CASCADE",
  })
  user!: User;

  /* ────── Data ────── */
  @Column({ length: 30, nullable: true })
  videoId!: string | null;   // YouTube ID

  @Column({ length: 24, nullable: true })
  imageId!: string | null;   // Mongo ObjectId as string

  @Column({ type: "enum", enum: HistoryType, })
  type!: HistoryType;

  @CreateDateColumn()
  timestamp!: Date;
}





