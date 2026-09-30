/**
 * Tema DigiUrban Glass — parte que roda no servidor (sem 'use client').
 * O script aplica o tema no <html> antes da primeira pintura e marca
 * data-font="sf" nos aparelhos Apple (lá a SF Pro aparece sozinha; fora deles
 * a Inter recebe o ajuste fino de espaçamento em liquid-glass.css).
 */

export const THEME_STORAGE_KEY = 'digiurban-theme';

export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}try{if(/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent))document.documentElement.setAttribute('data-font','sf');}catch(e){}})();`;
