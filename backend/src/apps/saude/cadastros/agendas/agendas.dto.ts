import { IsString, IsBoolean, IsOptional, IsInt, IsDateString, MaxLength, Min, Max } from 'class-validator';

export class CreateAgendaMedicaDto {
  @IsString()
  profissionalId: string;

  @IsString()
  unidadeId: string;

  @IsOptional()
  @IsString()
  especialidadeId?: string;

  @IsOptional()
  @IsString()
  salaId?: string;

  @IsOptional()
  @IsString()
  turnoId?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado

  @IsString()
  @MaxLength(5)
  horaInicio: string; // "08:00"

  @IsString()
  @MaxLength(5)
  horaFim: string; // "12:00"

  @IsInt()
  @Min(1)
  tempoPorConsulta: number; // Minutos (duração de cada consulta)

  @IsInt()
  @Min(1)
  vagasDisponiveis: number; // Vagas por horário

  @IsOptional()
  @IsDateString()
  dataInicio?: string; // Data de início da vigência

  @IsOptional()
  @IsDateString()
  dataFim?: string; // Data de fim da vigência

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAgendaMedicaDto {
  @IsOptional()
  @IsString()
  profissionalId?: string;

  @IsOptional()
  @IsString()
  unidadeId?: string;

  @IsOptional()
  @IsString()
  especialidadeId?: string;

  @IsOptional()
  @IsString()
  salaId?: string;

  @IsOptional()
  @IsString()
  turnoId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaFim?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tempoPorConsulta?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagasDisponiveis?: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
