import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';

export class EmergencyContactDto {
  @IsString()
  name: string;
  @IsString()
  phone: string;
  @IsString()
  relation: string;
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Maria' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Santos' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '09171234567' })
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: { name: 'Jose Santos', phone: '09179876543', relation: 'Father' },
  })
  @IsOptional()
  @IsObject()
  emergencyContact?: EmergencyContactDto;
}
