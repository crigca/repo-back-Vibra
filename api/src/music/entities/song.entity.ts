import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'songs' })
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ length: 300 })
  artist!: string;

  @Column({ unique: true, length: 50 })
  @Index()
  youtubeId!: string;

  @Column()
  duration!: number; // En segundos

  @Column({ length: 100, nullable: true })
  @Index()
  genre?: string;

  @Column({ type: 'bigint', nullable: true })
  viewCount?: number;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ length: 500, nullable: true })
  audioPath?: string; // Ruta del archivo MP3 (ejemplo: "audio/lkxgOs2fSnU.mp3")

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  getId(): string {
    return this.id;
  }
}
