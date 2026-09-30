/**
 * Tema DigiUrban Glass — parte que roda no servidor (sem 'use client').
 * O script aplica o tema no <html> antes da primeira pintura.
 */

export const THEME_STORAGE_KEY = 'digiurban-theme';

export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
