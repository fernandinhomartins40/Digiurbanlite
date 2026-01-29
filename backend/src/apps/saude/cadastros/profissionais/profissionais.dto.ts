import { IsString, IsBoolean, IsOptional, IsEmail, IsEnum, IsInt, IsArray, MaxLength } from 'class-validator';

export enum StatusProfissional {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  FERIAS = 'FERIAS',
  AFASTADO = 'AFASTADO',
  LICENCA = 'LICENCA',
}

export class CreateProfissionalSaudeDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsString()
  @MaxLength(11)
  cpf: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rg?: string;

  @IsString()
  @MaxLength(50)
  registroProfissional: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tipoRegistro?: string; // 'CRM', 'COREN', 'CRO', 'CRP', 'CRF', 'CRN', etc.

  @IsOptional()
  @IsString()
  especialidade?: string; // Especialidade principal (mantido para compatibilidade)

  @IsOptional()
  @IsArray()
  especialidades?: string[]; // Array de IDs de especialidades

  @IsString()
  categoria: string; // 'Médico', 'Enfermeiro', 'Dentista', 'Psicólogo', 'Nutricionista', 'Farmacêutico'

  @IsOptional()
  @IsArray()
  unidadesAtendimento?: string[]; // Array de IDs das unidades

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  horarioAtendimento?: any; // JSON com horários estruturados

  @IsOptional()
  @IsArray()
  diasSemana?: any[]; // Array de dias

  @IsOptional()
  @IsInt()
  tempoMedioConsulta?: number; // Minutos

  @IsOptional()
  @IsBoolean()
  aceitaAgendamento?: boolean;

  @IsOptional()
  @IsEnum(StatusProfissional)
  status?: StatusProfissional;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfissionalSaudeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registroProfissional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tipoRegistro?: string;

  @IsOptional()
  @IsString()
  especialidade?: string;

  @IsOptional()
  @IsArray()
  especialidades?: string[];

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsArray()
  unidadesAtendimento?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  horarioAtendimento?: any;

  @IsOptional()
  @IsArray()
  diasSemana?: any[];

  @IsOptional()
  @IsInt()
  tempoMedioConsulta?: number;

  @IsOptional()
  @IsBoolean()
  aceitaAgendamento?: boolean;

  @IsOptional()
  @IsEnum(StatusProfissional)
  status?: StatusProfissional;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
