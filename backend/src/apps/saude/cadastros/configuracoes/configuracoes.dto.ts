import { IsString, IsBoolean, IsOptional, IsInt, IsArray, MaxLength, Min } from 'class-validator';

export class CreateConfiguracaoAtendimentoDto {
  @IsString()
  unidadeId: string;

  // Configurações de Senhas e Filas
  @IsOptional()
  @IsString()
  @MaxLength(5)
  prefixoSenha?: string; // Prefixo para senhas (A, B, C, etc.)

  @IsOptional()
  @IsBoolean()
  reiniciarSenhaDiariamente?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  senhaInicial?: number; // Número inicial das senhas

  // Horários de Funcionamento
  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaAberturaAtendimento?: string; // "07:00"

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaFechamentoAtendimento?: string; // "17:00"

  @IsOptional()
  @IsArray()
  diasFuncionamento?: any[]; // Array de dias da semana

  // Configurações de Triagem
  @IsOptional()
  @IsBoolean()
  triagemObrigatoria?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  tempoMedioTriagem?: number; // Minutos

  // Configurações de Agendamento
  @IsOptional()
  @IsBoolean()
  permitirAgendamento?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteAgendamentoDias?: number; // Quantos dias de antecedência permitir

  @IsOptional()
  @IsBoolean()
  permitirCancelamento?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteCancelamentoHoras?: number; // Horas antes da consulta

  // Configurações de Atendimento
  @IsOptional()
  @IsInt()
  @Min(1)
  tempoMedioConsulta?: number; // Minutos

  @IsOptional()
  @IsBoolean()
  permitirEncaixe?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  limiteEncaixesDia?: number;

  // Notificações
  @IsOptional()
  @IsBoolean()
  enviarSMSLembrete?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  horasAntesSMSLembrete?: number;

  @IsOptional()
  @IsBoolean()
  enviarEmailConfirmacao?: boolean;

  // Outras Configurações
  @IsOptional()
  @IsBoolean()
  exigirDocumentoIdentificacao?: boolean;

  @IsOptional()
  @IsBoolean()
  exigirCartaoSUS?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  toleranciaAtrasoMinutos?: number;

  @IsOptional()
  @IsBoolean()
  permitirFaltaSemJustificativa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteConsecutivoFaltas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  diasBloqueioAposFaltas?: number;
}

export class UpdateConfiguracaoAtendimentoDto {
  @IsOptional()
  @IsString()
  unidadeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  prefixoSenha?: string;

  @IsOptional()
  @IsBoolean()
  reiniciarSenhaDiariamente?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  senhaInicial?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaAberturaAtendimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaFechamentoAtendimento?: string;

  @IsOptional()
  @IsArray()
  diasFuncionamento?: any[];

  @IsOptional()
  @IsBoolean()
  triagemObrigatoria?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  tempoMedioTriagem?: number;

  @IsOptional()
  @IsBoolean()
  permitirAgendamento?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteAgendamentoDias?: number;

  @IsOptional()
  @IsBoolean()
  permitirCancelamento?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteCancelamentoHoras?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  tempoMedioConsulta?: number;

  @IsOptional()
  @IsBoolean()
  permitirEncaixe?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  limiteEncaixesDia?: number;

  @IsOptional()
  @IsBoolean()
  enviarSMSLembrete?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  horasAntesSMSLembrete?: number;

  @IsOptional()
  @IsBoolean()
  enviarEmailConfirmacao?: boolean;

  @IsOptional()
  @IsBoolean()
  exigirDocumentoIdentificacao?: boolean;

  @IsOptional()
  @IsBoolean()
  exigirCartaoSUS?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  toleranciaAtrasoMinutos?: number;

  @IsOptional()
  @IsBoolean()
  permitirFaltaSemJustificativa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteConsecutivoFaltas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  diasBloqueioAposFaltas?: number;
}
