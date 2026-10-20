/** Floor plan of Grandcafé Parkzicht. */
export function MapView() {
  const room = 'fill-[#efe3c8] stroke-[#2a1d15]';
  const label = { fontSize: 9, fill: '#2a1d15', fontFamily: 'Georgia, serif', textAnchor: 'middle' as const };
  return (
    <div className="paper rounded-md p-2">
      <svg viewBox="0 0 400 300" className="block h-auto w-full" role="img" aria-label="Plattegrond van Grandcafé Parkzicht">
        <defs>
          <pattern id="grass" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#cfd8b0" />
            <path d="M1 5 L2 2 M4 5 L4.5 2" stroke="#8aa060" strokeWidth="0.6" />
          </pattern>
        </defs>
        {/* garden + alley */}
        <rect x="30" y="6" width="360" height="40" fill="url(#grass)" stroke="#2a1d15" />
        <text x="210" y="30" {...label}>Tuin (achter)</text>
        <rect x="6" y="6" width="22" height="268" fill="#d8ccb0" stroke="#2a1d15" strokeDasharray="3 2" />
        <text x="17" y="140" {...label} transform="rotate(-90 17 140)">Steegje</text>
        {/* building */}
        <rect x="30" y="50" width="245" height="178" className={room} strokeWidth="2" />
        <text x="140" y="120" {...label} fontSize={12} fontWeight="bold">Grote zaal</text>
        <rect x="40" y="58" width="90" height="34" fill="#7a1f2b" fillOpacity="0.25" stroke="#7a1f2b" />
        <text x="85" y="79" {...label}>Podium (karaoke)</text>
        <rect x="236" y="62" width="30" height="150" fill="#8a6a42" fillOpacity="0.45" stroke="#2a1d15" />
        <text x="251" y="140" {...label} transform="rotate(-90 251 140)">Bar</text>
        <circle cx="160" cy="160" r="16" fill="#c9a24a" fillOpacity="0.35" stroke="#2a1d15" />
        <text x="160" y="186" {...label} fontSize={7.5}>Brotherhood-tafel</text>
        <rect x="48" y="150" width="62" height="34" rx="3" fill="#1f5a3a" fillOpacity="0.5" stroke="#2a1d15" />
        <text x="79" y="196" {...label} fontSize={7.5}>Pooltafel</text>
        {/* hallway */}
        <rect x="278" y="50" width="30" height="178" className={room} strokeWidth="2" />
        <text x="293" y="110" {...label} transform="rotate(-90 293 110)">Gang</text>
        <line x1="275" y1="182" x2="275" y2="210" stroke="#efe3c8" strokeWidth="4" />
        <line x1="278" y1="182" x2="278" y2="210" stroke="#efe3c8" strokeWidth="4" />
        <text x="276" y="222" {...label} fontSize={6.5}>doorgang</text>
        {/* coat rack */}
        <g>
          {[186, 194, 202].map((y) => (
            <path key={y} d={`M 303 ${y} l -6 0`} stroke="#7a1f2b" strokeWidth="2" />
          ))}
          <text x="330" y="246" {...label} fontSize={7}>↖ Garderobe</text>
        </g>
        <line x1="250" y1="200" x2="296" y2="195" stroke="#7a1f2b" strokeDasharray="2 2" />
        <text x="262" y="236" {...label} fontSize={6.5} fill="#7a1f2b">zichtlijn bar → garderobe</text>
        {/* back door */}
        <rect x="285" y="46" width="16" height="6" fill="#7a1f2b" />
        <text x="320" y="62" {...label} fontSize={6.5} textAnchor="start">↑ achterdeur</text>
        {/* rooms off hallway */}
        <rect x="312" y="50" width="78" height="42" className={room} />
        <text x="351" y="75" {...label}>Toiletten</text>
        <rect x="312" y="96" width="78" height="40" className={room} />
        <text x="351" y="119" {...label}>Kantoor Bennie</text>
        <text x="351" y="129" {...label} fontSize={6.5}>(reservesleutel)</text>
        <rect x="312" y="140" width="78" height="88" fill="#e6c6b0" stroke="#7a1f2b" strokeWidth="2" />
        <text x="351" y="170" {...label} fontWeight="bold">Achterkamer</text>
        <text x="351" y="196" {...label} fontSize={14} fill="#7a1f2b">✕</text>
        <rect x="308" y="150" width="6" height="18" fill="#7a1f2b" />
        <text x="351" y="214" {...label} fontSize={6.5}>alleen via de gang</text>
        {/* front */}
        <rect x="120" y="226" width="40" height="5" fill="#7a1f2b" />
        <text x="140" y="222" {...label} fontSize={6.5}>voordeur</text>
        <rect x="30" y="234" width="245" height="40" fill="#d8ccb0" stroke="#2a1d15" />
        <text x="140" y="252" {...label}>Voorterras (luifel, matglas)</text>
        <text x="140" y="266" {...label} fontSize={7}>asbak · fietsen</text>
        <text x="200" y="292" {...label} fontSize={8}>— Parkstraat —</text>
        {/* walking route */}
        <path d="M 293 46 L 293 26 L 20 26 L 20 250 L 30 250" fill="none" stroke="#7a1f2b" strokeWidth="1.4" strokeDasharray="5 3" markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#7a1f2b" />
          </marker>
        </defs>
        <text x="80" y="18" {...label} fontSize={7} fill="#7a1f2b">± 2 minuten lopen</text>
      </svg>
    </div>
  );
}
