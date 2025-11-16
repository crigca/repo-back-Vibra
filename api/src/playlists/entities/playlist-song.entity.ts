import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Song } from '../../music/entities/song.entity';

@Entity({ name: 'playlist_songs' })
@Unique(['playlistId', 'songId'])
@Unique(['playlistId', 'position'])
export class PlaylistSong {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  playlistId!: string;

  @Column({ type: 'uuid' })
  @Index()
  songId!: string;

  @Column()
  position!: number;

  @CreateDateColumn()
  addedAt!: Date;

  @ManyToOne(() => Playlist, (playlist) => playlist.playlistSongs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlistId' })
  playlist!: Playlist;

  @ManyToOne(() => Song, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'songId' })
  song!: Song;
}
