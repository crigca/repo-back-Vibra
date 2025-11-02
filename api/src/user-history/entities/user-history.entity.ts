import { Song } from "src/music/entities/song.entity";
import { User } from "src/users/entities/users.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user-history' })
export class UserHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.historyEntries, { nullable: false })
    user: User;

    @ManyToOne(() => Song, { nullable: true, onDelete: 'CASCADE' })
    song?: Song;

    @Column({ length: 50, nullable: true })
    youtubeId?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    playedAt: Date;

}
