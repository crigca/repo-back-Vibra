import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from "typeorm";
import { User } from "../../users/users.entity";
import { PlaylistSong } from "./playlist-song.entity";

@Entity({ name: "playlists" })
export class Playlist {
  @PrimaryGeneratedColumn("uuid") 
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ default: false })
  @Index()
  isPublic!: boolean;

  @Column({ length: 1000, nullable: true })
  coverImageUrl?: string;

  @Column({ default: 0 })
  totalDuration!: number;

  @Column({ default: 0 })
  songCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => PlaylistSong, playlistSong => playlistSong.playlist)
  playlistSongs!: PlaylistSong[];

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getUserId(): string | null {
    return this.userId || null;
  }
}