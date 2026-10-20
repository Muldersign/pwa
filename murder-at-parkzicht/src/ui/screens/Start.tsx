import { useState } from 'react';
import { Btn } from '../components/ui';
import { useGame } from '../store';

export function GoldenCock({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84" aria-hidden="true">
      <defs>
        <linearGradient id="gc" x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a22" />
          <stop offset="0.45" stopColor="#f6e2a4" />
          <stop offset="1" stopColor="#9b7a2e" />
        </linearGradient>
      </defs>
      <rect x="10" y="70" width="40" height="12" rx="1.5" fill="#2a1d15" stroke="#c9a24a" />
      <text x="30" y="79" fontSize="5.5" textAnchor="middle" fill="#e8c97a" fontFamily="Georgia, serif">B.o.B.</text>
      <rect x="16" y="64" width="28" height="7" fill="url(#gc)" />
      <circle cx="23" cy="56" r="9" fill="url(#gc)" />
      <circle cx="37" cy="56" r="9" fill="url(#gc)" />
      <rect x="22" y="6" width="16" height="52" rx="8" fill="url(#gc)" />
      <path d="M26 12 Q24 30 26 50" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function StartScreen({ onPlay }: { onPlay: () => void }) {
  const { state, start, reset } = useGame();
  const [confirm, setConfirm] = useState(false);
  const minutes = state ? Math.round(state.playMs / 60000) : 0;
  return (
    <div className="desk flex min-h-full flex-col items-center justify-center overflow-y-auto px-5 py-10 text-center">
      <div className="anim-fade max-w-md">
        <div className="font-type text-xs uppercase tracking-[0.35em] text-muted">Dossier PZ-2026-1024</div>
        <div className="anim-flicker mx-auto mt-6 w-fit drop-shadow-[0_0_24px_rgba(232,201,122,0.35)]">
          <GoldenCock size={70} />
        </div>
        <h1 className="mt-6 font-display text-[34px] font-extrabold leading-[1.05]">
          <span className="gold-text">The Night of Absolute Bullshit 2.0</span>
        </h1>
        <p className="mt-3 font-type text-lg tracking-widest text-bordeaux-2">MURDER AT PARKZICHT</p>
        <p className="mx-auto mt-6 max-w-sm text-[15px] text-parchment/85">
          Een interactieve detectivegame voor één speler. Ondervraag tien verdachten, onderzoek het bewijs en wijs de moordenaar van Milo Dubbelspel aan.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {state && !state.accusation && (
            <Btn kind="gold" onClick={onPlay}>
              Hervat onderzoek · hoofdstuk {state.chapter}
              {minutes > 0 && <span className="block text-xs font-normal opacity-75">{minutes} min gespeeld</span>}
            </Btn>
          )}
          {state?.accusation && (
            <Btn kind="gold" onClick={onPlay}>
              Bekijk de ontknoping
            </Btn>
          )}
          {!state && (
            <Btn
              kind="primary"
              onClick={() => {
                start();
                onPlay();
              }}
            >
              Start onderzoek
            </Btn>
          )}
          {state && !confirm && (
            <Btn kind="ghost" onClick={() => setConfirm(true)}>
              Nieuw onderzoek
            </Btn>
          )}
          {confirm && (
            <div className="paper anim-rise rounded-md p-3 text-[15px]">
              Je huidige voortgang wordt gewist. Zeker weten?
              <div className="mt-3 flex gap-2">
                <Btn kind="ghost" className="flex-1 !text-paper-ink" onClick={() => setConfirm(false)}>
                  Nee
                </Btn>
                <Btn
                  className="flex-1"
                  onClick={() => {
                    reset();
                    start();
                    setConfirm(false);
                    onPlay();
                  }}
                >
                  Ja, opnieuw
                </Btn>
              </div>
            </div>
          )}
        </div>
        <p className="mt-10 text-xs leading-relaxed text-muted">
          Speelduur ± 45 minuten · voortgang wordt automatisch bewaard op dit apparaat.
          <br />
          Alle personages en gebeurtenissen zijn verzonnen. Overeenkomsten met echte personen zeggen niets over hen.
        </p>
      </div>
    </div>
  );
}
