/**
 * Ao subir o servidor: cria (se faltar) o cofre de assinatura — chave mestra e
 * autoridade certificadora — e recifra, em todos os municípios, as chaves
 * privadas que ainda estão no formato antigo (texto fixo do código).
 * Idempotente: depois da primeira vez não há nada para converter.
 */

import { forEachActiveTenant } from '../lib/tenant-iterator';
import { reencryptLegacyKeys } from '../services/certificate-authority.service';
import { getCertMasterKey, getPlatformCA } from '../services/signing/keystore.service';

export function initSigningKeysStartup(): void {
  setTimeout(async () => {
    try {
      await getCertMasterKey();
      await getPlatformCA();
      let converted = 0;
      let failed = 0;
      await forEachActiveTenant('signing-keys-reencrypt', async () => {
        const result = await reencryptLegacyKeys();
        converted += result.converted;
        failed += result.failed;
      });
      if (converted || failed) console.log(`[assinatura] chaves recifradas: ${converted}; sem conserto (revogadas): ${failed}`);
    } catch (error) {
      console.error('[assinatura] cofre de chaves não preparado:', error);
    }
  }, 45_000);
}
