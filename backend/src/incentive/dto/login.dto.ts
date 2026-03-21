import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  token: string;
  expiresAt: string;
  user: {
    id: number;
    loginId: string;
    name: string;
    role: string;
    access: string[];
  };
}
