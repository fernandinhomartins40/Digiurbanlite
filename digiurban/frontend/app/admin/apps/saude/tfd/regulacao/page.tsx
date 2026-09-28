import { redirect } from 'next/navigation';

// Tela duplicada consolidada: a regulação médica do TFD vive em /regulacao-medica
// (esta versão lia campos que não existem na solicitação — citizen, dataSolicitacao,
// municipioDestino — e exibia "Paciente"/datas inválidas).
export default function RegulacaoRedirectPage() {
  redirect('/admin/apps/saude/tfd/regulacao-medica');
}
