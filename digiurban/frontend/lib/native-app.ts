/**
 * App nativo (Capacitor) — 2026-11-10.
 *
 * O app Android/iOS abre este mesmo site num WebView. Aqui o site percebe que
 * está dentro do app (`window.Capacitor`) e usa os recursos do celular pelos
 * plugins (`window.Capacitor.Plugins.*`), sem dependência nova:
 *  - avisos push nativos (FCM/APNs) → POST /api/native-push/devices;
 *  - baixar arquivo: o WebView não baixa sozinho → grava no celular e abre o
 *    "Compartilhar/Abrir com" (Filesystem + Share);
 *  - link para fora do site → navegador do sistema (Browser);
 *  - link do app / toque no aviso → abre a tela certa sem recarregar.
 * Fora do app nada disso roda: o site continua igual.
 */

type Router = { push: (href: string) => void };

const TOKEN_STORAGE = 'du_native_push_token';

function cap(): any {
  return typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
}

function plugin(name: string): any {
  return cap()?.Plugins?.[name];
}

export function isNativeApp(): boolean {
  try {
    return Boolean(cap()?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function nativePlatform(): 'android' | 'ios' | 'web' {
  if (!isNativeApp()) return 'web';
  const platform = cap()?.getPlatform?.();
  return platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';
}

// ---------------------------------------------------------------- links externos

export async function openExternal(url: string) {
  const browser = plugin('Browser');
  if (isNativeApp() && browser) {
    try {
      await browser.open({ url });
      return;
    } catch {
      // cai no padrão
    }
  }
  originalOpen?.call(window, url, '_blank', 'noopener');
}

// ---------------------------------------------------------------- arquivos

const EXTENSION_BY_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'text/html': 'html',
  'application/json': 'json',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function fileNameFor(name: string | undefined, type: string, fallback: string): string {
  let clean = (name || fallback || 'arquivo').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'arquivo';
  const ext = EXTENSION_BY_TYPE[(type || '').split(';')[0]];
  if (ext && !/\.[a-z0-9]{2,5}$/i.test(clean)) clean += `.${ext}`;
  return clean;
}

function nameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // segue
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1];
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva o arquivo e abre o "Compartilhar/Abrir com" do celular. Fora do app,
 * baixa como o navegador faria. `source` = Blob ou endereço (com a sessão).
 */
export async function saveAndOpenFile(source: Blob | string, name?: string) {
  if (!isNativeApp()) {
    const href = typeof source === 'string' ? source : URL.createObjectURL(source);
    const link = document.createElement('a');
    link.href = href;
    link.download = name || '';
    originalClick ? originalClick.call(link) : link.click();
    return;
  }
  let blob: Blob;
  let fileName = name;
  if (typeof source === 'string') {
    const kept = blobByUrl.get(source);
    if (kept) {
      blob = kept;
    } else {
      const response = await fetch(source, { credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível baixar o arquivo.');
      fileName = fileName || nameFromDisposition(response.headers.get('content-disposition'));
      blob = await response.blob();
    }
    if (!fileName && !source.startsWith('blob:') && !source.startsWith('data:')) {
      fileName = decodeURIComponent(new URL(source, location.href).pathname.split('/').pop() || '');
    }
  } else {
    blob = source;
  }
  const finalName = fileNameFor(fileName, blob.type, 'arquivo');
  const { uri } = await plugin('Filesystem').writeFile({ path: finalName, data: await toBase64(blob), directory: 'CACHE' });
  try {
    await plugin('Share').share({ title: finalName, files: [uri] });
  } catch {
    // a pessoa fechou o compartilhar: o arquivo continua salvo
  }
}

// ---------------------------------------------------------------- push

let pushListenersOn = false;
let pushPortal: 'citizen' | 'admin' = 'citizen';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE);
  } catch {
    return null;
  }
}

async function sendToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE, token);
  } catch {
    // sem armazenamento: só não sai na hora do logout
  }
  await fetch('/api/native-push/devices', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: nativePlatform() === 'ios' ? 'IOS' : 'ANDROID', portal: pushPortal }),
  }).catch(() => undefined);
}

/** Depois do login: pede permissão (uma vez) e guarda o aparelho para os avisos */
export async function registerNativePush(portal: 'citizen' | 'admin') {
  const push = plugin('PushNotifications');
  if (!isNativeApp() || !push) return;
  pushPortal = portal;
  try {
    if (!pushListenersOn) {
      pushListenersOn = true;
      await push.addListener('registration', (event: { value: string }) => {
        if (event?.value) void sendToken(event.value);
      });
    }
    let permission = await push.checkPermissions();
    if (permission.receive !== 'granted' && permission.receive !== 'denied') permission = await push.requestPermissions();
    if (permission.receive !== 'granted') return;
    await push.register();
  } catch {
    // sem push: o app segue funcionando
  }
}

/** Token deste aparelho (para quem troca de município mandar em nativePushToken) */
export function nativePushToken(): string | null {
  return isNativeApp() ? readToken() : null;
}

/** Ao sair da conta: este aparelho para de receber os avisos da pessoa */
export async function unregisterNativePush() {
  if (!isNativeApp()) return;
  const token = readToken();
  if (!token) return;
  try {
    localStorage.removeItem(TOKEN_STORAGE);
  } catch {
    // segue
  }
  await fetch('/api/native-push/devices', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}

// ---------------------------------------------------------------- ponte global

const blobByUrl = new Map<string, Blob>();
let originalOpen: typeof window.open | null = null;
let originalClick: (() => void) | null = null;
let installed = false;

const FILE_PATH = /^\/(api|uploads)\/|\.(pdf|csv|xlsx?|docx?|zip|json|txt|png|jpe?g|odt|ods)$/i;

/** Decide o que fazer com um endereço aberto dentro do app. true = já tratado. */
function handleUrl(rawUrl: string, router: Router, opts: { download?: string | null; newWindow?: boolean }): boolean {
  if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:')) return false;
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    void saveAndOpenFile(rawUrl, opts.download || undefined).catch(() => undefined);
    return true;
  }
  let url: URL;
  try {
    url = new URL(rawUrl, location.href);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false; // mailto:, tel:… o sistema abre
  if (url.host !== location.host) {
    void openExternal(url.href);
    return true;
  }
  if (opts.download !== null && opts.download !== undefined) {
    void saveAndOpenFile(url.href, opts.download || undefined).catch(() => undefined);
    return true;
  }
  if (!opts.newWindow) return false;
  if (FILE_PATH.test(url.pathname)) {
    void saveAndOpenFile(url.href).catch(() => undefined);
  } else {
    router.push(url.pathname + url.search + url.hash);
  }
  return true;
}

/** "Janela" falsa para quem abre uma janela e escreve nela (impressão) */
function fakeWindow(): any {
  let html = '';
  return {
    closed: false,
    focus() {},
    close() {},
    print() {},
    addEventListener() {},
    document: {
      write(chunk: string) {
        html += chunk;
      },
      close() {
        if (html) void saveAndOpenFile(new Blob([html], { type: 'text/html' }), 'documento.html').catch(() => undefined);
      },
    },
  };
}

/** Só caminho do próprio site: "/cidadao/..." ou link universal do mesmo endereço */
function navigateTo(rawUrl: string | undefined, router: Router, allowAppLink = false) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
    router.push(rawUrl);
    return;
  }
  if (!allowAppLink) return; // aviso com endereço de fora: ignora
  try {
    const url = new URL(rawUrl);
    if (url.protocol.startsWith('http')) {
      if (url.host !== location.host) return;
      router.push(url.pathname + url.search + url.hash);
    } else {
      // esquema do app (digiurban://cidadao/...)
      router.push(`/${url.host}${url.pathname}`.replace(/\/{2,}/g, '/') + url.search + url.hash);
    }
  } catch {
    // endereço estranho: ignora
  }
}

/**
 * Liga a ponte uma vez (layout raiz). Fora do app não faz nada.
 * Atende todas as telas sem mexer nelas: <a download>, blob:, window.open e
 * links target="_blank".
 */
export function installNativeBridge(router: Router) {
  if (installed || !isNativeApp()) return;
  installed = true;

  // o arquivo ainda precisa existir quando a tela já revogou o endereço
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (object: Blob | MediaSource) => {
    const url = create(object);
    if (object instanceof Blob) blobByUrl.set(url, object);
    return url;
  };
  URL.revokeObjectURL = (url: string) => {
    setTimeout(() => {
      blobByUrl.delete(url);
      revoke(url);
    }, 60000);
  };

  originalClick = HTMLAnchorElement.prototype.click;
  const nativeClick = originalClick;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    // link solto (fora da página) não passa pelo ouvinte de clique abaixo
    if (!this.isConnected && handleUrl(this.getAttribute('href') || '', router, { download: this.getAttribute('download'), newWindow: this.target === '_blank' })) return;
    nativeClick.call(this);
  };

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (handleUrl(anchor.getAttribute('href') || '', router, { download: anchor.getAttribute('download'), newWindow: anchor.target === '_blank' })) {
        event.preventDefault();
      }
    },
    true
  );

  originalOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string) => {
    const href = url ? String(url) : '';
    if (!href || href === 'about:blank') return fakeWindow();
    if (handleUrl(href, router, { newWindow: target !== '_self' })) return fakeWindow();
    return originalOpen!(href, target);
  }) as typeof window.open;

  plugin('App')?.addListener?.('appUrlOpen', (event: { url: string }) => navigateTo(event?.url, router, true));
  plugin('PushNotifications')?.addListener?.('pushNotificationActionPerformed', (event: any) => {
    const data = event?.notification?.data || {};
    navigateTo(data.url || (data.recipientType === 'user' ? '/admin' : '/cidadao'), router);
  });
}
