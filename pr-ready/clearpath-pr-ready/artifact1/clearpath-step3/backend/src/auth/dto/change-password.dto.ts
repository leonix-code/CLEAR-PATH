import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(10) @MaxLength(128) @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])/) newPassword: string;
}
