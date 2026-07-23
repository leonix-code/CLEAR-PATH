import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * SECURITY FIX (C1): `role` is REMOVED from public registration.
 * Self-service signup can ONLY ever create a STUDENT. Privileged roles
 * (officers, admins, auditors) are provisioned exclusively through the
 * admin-only invite flow (see AdminUsersController.invite()).
 */
export class RegisterDto {
  @ApiProperty({ example: 'john@university.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])/, {
    message: 'Password must contain upper, lower, number and symbol',
  })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
