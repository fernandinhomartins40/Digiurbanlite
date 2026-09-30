/**
 * Fundo ambiente do DigiUrban Glass: manchas de cor suaves que o vidro
 * "pega" (a Apple: o vidro não tem cor própria, ele reflete o que está atrás).
 */
export function LgAmbient({ colors = ['#3B9BFF', '#FF5FA8', '#3DDC84'] }: { colors?: [string, string, string] | string[] }) {
  return (
    <div aria-hidden="true" className="lg-ambient">
      <div className="lg-orb" style={{ width: 460, height: 460, left: -160, top: -180, background: colors[0] }} />
      <div className="lg-orb" style={{ width: 380, height: 380, right: -140, top: '35%', background: colors[1] }} />
      <div className="lg-orb" style={{ width: 420, height: 420, left: '30%', bottom: -240, background: colors[2] }} />
    </div>
  );
}
