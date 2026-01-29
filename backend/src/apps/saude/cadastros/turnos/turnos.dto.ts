import { IsString, IsBoolean, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateTurnoTrabalhoDto {
  @IsString()
  @MaxLength(100)
  nome: string; // "Manhã", "Tarde", "Noite", "Integral"

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  @MaxLength(5)
  horaInicio: string; // "08:00"

  @IsString()
  @MaxLength(5)
  horaFim: string; // "12:00"

  @IsOptional()
  @IsArray()
  diasSemana?: any[]; // Array de dias da semana

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cor?: string; // Cor para visualização (ex: "#10B981")

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateTurnoTrabalhoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaFim?: string;

  @IsOptional()
  @IsArray()
  diasSemana?: any[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
