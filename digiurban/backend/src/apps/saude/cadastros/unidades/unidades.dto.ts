import { IsString, IsBoolean, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateUnidadeSaudeDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsString()
  tipo: string; // 'UBS', 'UPA', 'Hospital', 'Clínica', 'Posto', 'Outro'

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cnes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  horario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horarioAbertura?: string; // "07:00"

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horarioFechamento?: string; // "17:00"

  @IsOptional()
  especialidades?: string[]; // Array de IDs de especialidades

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUnidadeSaudeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cnes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  horario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horarioAbertura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horarioFechamento?: string;

  @IsOptional()
  especialidades?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
