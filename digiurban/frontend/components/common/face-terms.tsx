/**
 * Textos de consentimento da biometria facial (LGPD art. 8º e 11: consentimento
 * específico, informado e por finalidade). Versão registrada no servidor:
 * biometria-v1-2026-10 — ao mudar o texto, mude TERMS_VERSION no serviço de face.
 */

export const FACE_PURPOSE_LABEL: Record<string, string> = {
  IDENTITY_VERIFICATION: 'Confirmar identidade',
  SCHOOL_SECURITY: 'Segurança escolar (entrada e saída)',
};

/** Cadastro pelo próprio cidadão: confirmar a identidade */
export const FACE_TERMS_BODY = (
  <>
    <p>
      <strong>Para que serve:</strong> confirmar que é você mesmo(a) ao usar serviços da prefeitura (por exemplo, o
      nível Ouro da conta). Não usamos sua biometria para nenhuma outra finalidade.
    </p>
    <p>
      <strong>O que guardamos:</strong> uma foto do seu rosto (cifrada) e uma assinatura numérica dela, só no servidor
      do município. Nada é compartilhado com empresas ou outros municípios.
    </p>
    <p>
      <strong>Seus direitos:</strong> você pode ver e apagar sua biometria quando quiser, nesta mesma tela. Cada consulta
      à sua biometria fica registrada.
    </p>
  </>
);


/** Cadastro presencial feito pelo servidor (titular ou responsável presente) */
export const FACE_TERMS_IN_PERSON = (
  <>
    <p>
      Antes de capturar, explique à pessoa: a biometria serve para confirmar a identidade dela nos serviços da prefeitura;
      guardamos uma foto cifrada e uma assinatura numérica do rosto, só no município; ela pode pedir para apagar a qualquer
      momento (no portal do cidadão ou aqui).
    </p>
    <p>Confirme que a pessoa concordou. Se houver termo assinado em papel, marque também essa opção.</p>
  </>
);

/** Aluno: autorização do responsável (LGPD art. 14 — dados de criança e adolescente) */
export const FACE_TERMS_SCHOOL = (
  <>
    <p>
      <strong>Para que serve:</strong> reconhecer o aluno na entrada e na saída da escola e avisar o responsável. Não é
      usado para nenhuma outra finalidade.
    </p>
    <p>
      <strong>Quem autoriza:</strong> a mãe, o pai ou o responsável legal. Registre o nome de quem autorizou. O
      responsável pode cancelar a autorização a qualquer momento; a biometria do aluno é apagada.
    </p>
    <p>
      <strong>Guarda:</strong> as fotos de passagem são apagadas automaticamente no prazo definido pela prefeitura.
    </p>
  </>
);
