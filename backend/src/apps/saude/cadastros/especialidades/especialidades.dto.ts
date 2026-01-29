import { IsString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateEspecialidadeMedicaDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string; // 'Clínica Médica', 'Cirúrgica', 'Diagnóstica'

  @IsOptional()
  @IsInt()
  tempoMedioConsulta?: number; // Minutos

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cor?: string; // Cor para visualização em agendas (ex: "#3B82F6")

  @IsOptional()
  @IsString()
  requisitosPaciente?: string; // 'Encaminhamento', 'Livre'

  @IsOptional()
  examesComuns?: any; // JSON - Array de exames

  @IsOptional()
  unidadesQueOferecem?: any; // JSON - IDs das unidades

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEspecialidadeMedicaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsInt()
  tempoMedioConsulta?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cor?: string;

  @IsOptional()
  @IsString()
  requisitosPaciente?: string;

  @IsOptional()
  examesComuns?: any;

  @IsOptional()
  unidadesQueOferecem?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
