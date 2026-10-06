import {
  canReadConversation,
  canWriteConversation,
  NOTICES_PARTICIPANT_ID,
} from '../src/server/accessControl';
import { normalizeChatPayload, parseCookieHeader, pickSessionToken, portalFrom } from '../src/utils/authToken';

const T = 'tenant-palmital';
const citizen = { userId: 'cit1', userType: 'CITIZEN', tenantId: T };
const attendant = { userId: 'srv1', userType: 'SERVER', tenantId: T };
const otherServer = { userId: 'srv2', userType: 'SERVER', tenantId: T };
const foreignServer = { userId: 'srv9', userType: 'SERVER', tenantId: 'outro' };

const botConversation = (takenOverBy?: string) => ({
  tenantId: T,
  participant1Id: 'cit1',
  participant1Type: 'CITIZEN',
  participant2Id: 'DIGIBOT_SYSTEM',
  participant2Type: 'SYSTEM',
  isBotConversation: true,
  metadata: takenOverBy ? { takenOverBy } : {},
});

describe('chat — quem pode ler e escrever', () => {
  it('atendente que assumiu a conversa do assistente pode responder; os outros não', () => {
    const conv = botConversation('srv1');
    expect(canWriteConversation(conv, attendant)).toBe(true);
    expect(canWriteConversation(conv, otherServer)).toBe(false);
    expect(canReadConversation(conv, otherServer)).toBe(true); // supervisão do município
    expect(canReadConversation(conv, foreignServer)).toBe(false);
    expect(canWriteConversation(conv, foreignServer)).toBe(false);
    // o cidadão fala com o assistente pela rota do bot, não pelo chat comum
    expect(canWriteConversation(conv, citizen)).toBe(false);
  });

  it('sem ninguém assumir, ninguém responde pelo chat comum', () => {
    expect(canWriteConversation(botConversation(), attendant)).toBe(false);
  });

  it('conversa de avisos: o cidadão lê, ninguém responde', () => {
    const notices = {
      tenantId: T,
      participant1Id: 'cit1',
      participant1Type: 'CITIZEN',
      participant2Id: NOTICES_PARTICIPANT_ID,
      participant2Type: 'SYSTEM',
      isBotConversation: false,
    };
    expect(canReadConversation(notices, citizen)).toBe(true);
    expect(canWriteConversation(notices, citizen)).toBe(false);
  });

  it('conversa comum: só os participantes', () => {
    const conv = {
      tenantId: T,
      participant1Id: 'srv1',
      participant1Type: 'SERVER',
      participant2Id: 'cit1',
      participant2Type: 'CITIZEN',
      isBotConversation: false,
    };
    expect(canWriteConversation(conv, citizen)).toBe(true);
    expect(canWriteConversation(conv, attendant)).toBe(true);
    expect(canWriteConversation(conv, otherServer)).toBe(false);
    expect(canReadConversation(conv, otherServer)).toBe(false);
  });
});

describe('chat — qual sessão vale', () => {
  const cookies = { digiurban_admin_token: 'ADMIN', digiurban_citizen_token: 'CIDADAO', digiurban_platform_token: 'PLAT' };

  it('no portal do cidadão vale a sessão de cidadão, mesmo com a de servidor no navegador', () => {
    expect(pickSessionToken(cookies, portalFrom(undefined, 'https://palmital.digiurban.com.br/cidadao/assistente'))).toBe('CIDADAO');
    expect(pickSessionToken(cookies, portalFrom('citizen'))).toBe('CIDADAO');
    expect(pickSessionToken(cookies, portalFrom(undefined, 'https://palmital.digiurban.com.br/admin/mensagens'))).toBe('ADMIN');
    expect(pickSessionToken(cookies, portalFrom(undefined, 'https://digiurban.com.br/super-admin'))).toBe('PLAT');
    expect(pickSessionToken({ digiurban_citizen_token: 'CIDADAO' }, 'admin')).toBe('CIDADAO');
  });

  it('lê cookies do cabeçalho e converte o formato do login', () => {
    expect(parseCookieHeader('a=1; digiurban_citizen_token=x%3Dy')).toEqual({ a: '1', digiurban_citizen_token: 'x=y' });
    expect(normalizeChatPayload({ type: 'citizen', citizenId: 'c1' })).toMatchObject({ userId: 'c1', userType: 'CITIZEN' });
    expect(normalizeChatPayload({ type: 'admin', userId: 'u1' })).toMatchObject({ userId: 'u1', userType: 'SERVER' });
    expect(normalizeChatPayload({ type: 'platform', platformUserId: 'p1' })).toMatchObject({
      userId: 'platform:p1',
      userType: 'SERVER',
      isPlatformOperator: true,
    });
  });
});
