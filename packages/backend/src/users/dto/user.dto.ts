import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength
} from "class-validator";

export class UserDto {
  @IsNotEmpty()
  public readonly prenom: string;

  @IsNotEmpty()
  public readonly nom: string;

  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;

  @IsNotEmpty()
  @MinLength(11, {
    message: "PASSWORD_TOO_SMALL"
  })
  @MaxLength(100, {
    message: "PASSWORD_TOO_LONG"
  })
  public readonly password: string;

  @IsNotEmpty()
  @IsNumber()
  public readonly structureId: number;

  @IsOptional()
  public readonly structure: {};

  @IsOptional()
  public readonly phone: string;
}