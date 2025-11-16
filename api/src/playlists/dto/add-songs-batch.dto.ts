import { IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddSongToPlaylistDto } from './add-song-playlist.dto';

export class AddSongsBatchDto {
  @IsArray({ message: 'songs debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos 1 canción' })
  @ArrayMaxSize(30, { message: 'No puede agregar más de 30 canciones a la vez' })
  @ValidateNested({ each: true })
  @Type(() => AddSongToPlaylistDto)
  songs: AddSongToPlaylistDto[];
}
