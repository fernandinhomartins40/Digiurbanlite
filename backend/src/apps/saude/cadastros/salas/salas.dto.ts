import { IsString, IsBoolean, IsOptional, IsEnum, IsInt, MaxLength } from 'class-validator';

export enum TipoSala {
  CONSULTORIO = 'CONSULTORIO',
  ENFERMAGEM = 'ENFERMAGEM',
  CURATIVO = 'CURATIVO',
  VACINA = 'VACINA',
  PROCEDIMENTO = 'PROCEDIMENTO',
  ODONTOLOGIA = 'ODONTOLOGIA',
  EXAMES = 'EXAMES',
  COLETA = 'COLETA',
  OBSERVACAO = 'OBSERVACAO',
  EMERGENCIA = 'EMERGENCIA',
  OUTRO = 'OUTRO',
}

export class CreateSalaConsultorioDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @IsEnum(TipoSala)
  tipo: TipoSala;

  @IsString()
  unidadeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  andar?: string;

  @IsOptional()
  @IsInt()
  capacidade?: number;

  @IsOptional()
  equipamentos?: any; // JSON - Array de equipamentos

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class UpdateSalaConsultorioDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @IsEnum(TipoSala)
  tipo?: TipoSala;

  @IsOptional()
  @IsString()
  unidadeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  andar?: string;

  @IsOptional()
  @IsInt()
  capacidade?: number;

  @IsOptional()
  equipamentos?: any;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
