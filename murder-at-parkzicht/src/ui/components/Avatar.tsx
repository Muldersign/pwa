import type { AvatarSpec } from '../../engine/types';

/** Illustrated, deliberately uniform portrait. Every suspect uses the same frame,
 *  so no portrait stands out from the others. */
export function Avatar({ spec, size = 56, name }: { spec: AvatarSpec; size?: number; name: string }) {
  const { skin, hair, hairStyle, accent, accessory } = spec;
  const id = name.replace(/\W/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Portret van ${name}`} className="shrink-0">
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#140e0b" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#bg-${id})`} stroke="#c9a24a" strokeWidth="1.5" />
      {/* long hair behind */}
      {(hairStyle === 'long' || hairStyle === 'wavy') && <path d="M17 30 Q16 52 22 56 L42 56 Q48 52 47 30 Z" fill={hair} />}
      {/* shoulders */}
      <path d="M10 64 Q12 47 32 46 Q52 47 54 64 Z" fill={accent} stroke="#000" strokeOpacity="0.25" />
      <path d="M27 46 L32 53 L37 46" fill="none" stroke="#000" strokeOpacity="0.25" />
      {accessory === 'bowtie' && <path d="M26 49 L32 51 L38 49 L38 54 L32 52 L26 54 Z" fill="#7a1f2b" />}
      {accessory === 'scarf' && <path d="M22 46 Q32 52 42 46 L42 50 Q32 56 22 50 Z" fill="#c9a24a" />}
      {accessory === 'camera' && (
        <g>
          <path d="M22 46 L28 56 M42 46 L36 56" stroke="#111" strokeWidth="1.2" />
          <rect x="26" y="54" width="12" height="8" rx="1.5" fill="#222" />
          <circle cx="32" cy="58" r="2.6" fill="#555" stroke="#999" strokeWidth="0.6" />
        </g>
      )}
      {/* neck + head */}
      <rect x="28" y="38" width="8" height="9" fill={skin} />
      <ellipse cx="32" cy="29" rx="12" ry="14" fill={skin} />
      {/* hair */}
      {hairStyle === 'short' && <path d="M20 26 Q21 14 32 14 Q43 14 44 26 Q40 19 32 19 Q24 19 20 26 Z" fill={hair} />}
      {hairStyle === 'spiky' && <path d="M20 25 L22 15 L26 19 L29 12 L32 18 L35 11 L38 18 L42 14 L44 25 Q38 19 32 20 Q25 19 20 25 Z" fill={hair} />}
      {hairStyle === 'curly' && (
        <g fill={hair}>
          {[18, 23, 28, 33, 38, 43, 46, 17].map((x, i) => (
            <circle key={i} cx={x} cy={i > 5 ? 26 : 18 - (i % 2) * 2} r="5" />
          ))}
        </g>
      )}
      {hairStyle === 'long' && <path d="M19 30 Q18 14 32 14 Q46 14 45 30 Q42 20 32 20 Q22 20 19 30 Z" fill={hair} />}
      {hairStyle === 'wavy' && <path d="M19 28 Q19 13 32 14 Q45 13 45 28 Q41 21 36 22 Q32 18 27 22 Q22 21 19 28 Z" fill={hair} />}
      {hairStyle === 'bob' && <path d="M19 34 Q17 14 32 14 Q47 14 45 34 L41 34 Q42 22 32 21 Q22 22 23 34 Z" fill={hair} />}
      {hairStyle === 'bun' && (
        <g fill={hair}>
          <circle cx="32" cy="11" r="5.5" />
          <path d="M20 26 Q21 15 32 15 Q43 15 44 26 Q40 20 32 20 Q24 20 20 26 Z" />
        </g>
      )}
      {hairStyle === 'ponytail' && (
        <g fill={hair}>
          <path d="M20 27 Q20 14 32 14 Q44 14 44 27 Q40 19 32 19 Q24 19 20 27 Z" />
          <path d="M43 20 Q52 26 47 40 Q45 30 42 26 Z" />
        </g>
      )}
      {hairStyle === 'bald' && <path d="M21 24 Q23 17 32 16 Q41 17 43 24" fill="none" stroke={hair} strokeWidth="1.2" strokeOpacity="0.5" />}
      {accessory === 'cap' && <path d="M19 23 Q20 12 32 12 Q44 12 45 23 Z M44 22 L52 24 L44 25 Z" fill="#2b2b2b" />}
      {accessory === 'headphones' && (
        <g fill="none" stroke="#222" strokeWidth="2.4">
          <path d="M19 28 Q19 12 32 12 Q45 12 45 28" />
          <rect x="16.5" y="26" width="5" height="8" rx="2" fill="#333" />
          <rect x="42.5" y="26" width="5" height="8" rx="2" fill="#333" />
        </g>
      )}
      {/* face */}
      <ellipse cx="27.5" cy="29" rx="1.3" ry="1.5" fill="#1a120d" />
      <ellipse cx="36.5" cy="29" rx="1.3" ry="1.5" fill="#1a120d" />
      <path d="M25 25.5 Q27.5 24.5 30 25.5 M34 25.5 Q36.5 24.5 39 25.5" stroke={hair} strokeWidth="1" fill="none" />
      <path d="M32 30 L31 34 L33 34" stroke="#000" strokeOpacity="0.25" fill="none" />
      <path d="M28.5 37 Q32 39 35.5 37" stroke="#5a2a20" strokeWidth="1.1" fill="none" />
      {accessory === 'glasses' && (
        <g fill="none" stroke="#1a120d" strokeWidth="1.1">
          <circle cx="27.5" cy="29" r="3.6" />
          <circle cx="36.5" cy="29" r="3.6" />
          <path d="M31.1 29 L32.9 29" />
        </g>
      )}
      {accessory === 'beard' && <path d="M21 32 Q22 44 32 44 Q42 44 43 32 Q41 39 36 38.5 Q32 41 28 38.5 Q23 39 21 32 Z" fill={hair} />}
      {accessory === 'moustache' && <path d="M27 35 Q32 33 37 35 Q34 36.5 32 35.5 Q30 36.5 27 35 Z" fill={hair} />}
      {accessory === 'earrings' && (
        <g fill="#e8c97a">
          <circle cx="20" cy="33" r="1.6" />
          <circle cx="44" cy="33" r="1.6" />
        </g>
      )}
      {accessory === 'pen' && <rect x="45" y="18" width="2" height="12" rx="1" fill="#7a1f2b" transform="rotate(20 46 24)" />}
    </svg>
  );
}

export function MiloAvatar({ size = 56 }: { size?: number }) {
  return <Avatar size={size} name="Milo" spec={{ skin: '#e6c3a3', hair: '#3b2a1e', hairStyle: 'short', accent: '#3a3a3a', accessory: 'scarf' }} />;
}
