/**
 * Ilustraciones botánicas SVG — estilo grabado con color.
 * Trazos de tinta cálida oscura + rellenos botánicos (verdes, tierra, rojo, amarillo).
 * Los cards sin foto usan fondo blanco/crema para que los colores respiren.
 */

// ── Paleta de tinta ───────────────────────────────────────────────────────────
const INK  = "rgba(44,22,0,0.82)";   // trazo principal (tinta oscura cálida)
const INK2 = "rgba(44,22,0,0.38)";   // trazo secundario / costillas / detalles sutiles

// ── Verdes botánicos ──────────────────────────────────────────────────────────
const G1 = "#3A6425";   // verde sombra / borde hoja
const G2 = "#5E8F3A";   // verde hoja principal
const G3 = "#9AC86A";   // verde claro / brote / hoja joven

// ── Tierras y maderas ─────────────────────────────────────────────────────────
const E1 = "#7A4E22";   // madera oscura (ramas principales, tallos leñosos)
const E2 = "#A87840";   // madera/tierra media (ramas secundarias, vid)

// ── Rojos ─────────────────────────────────────────────────────────────────────
const R1 = "#C03A24";   // rojo tomate / baya
const R2 = "#E05A3A";   // rojo-naranja / tomate más claro

// ── Amarillos ─────────────────────────────────────────────────────────────────
const Y1 = "#D4A018";   // girasol / acento dorado
const Y2 = "#F0D45A";   // luna / dorado pálido

// ── Azul agua ─────────────────────────────────────────────────────────────────
const B1 = "#4A82B4";   // gota de agua

// ── Olla esmaltada ────────────────────────────────────────────────────────────
const POT  = "#3E526A";
const POT2 = "#5C7A90";

// ── Regadera (terracota) ──────────────────────────────────────────────────────
const TC1 = "#C06040";
const TC2 = "#8C3E26";

// ── Berries / bayas ───────────────────────────────────────────────────────────
const BRY = "#7A2438";   // borgoña oscuro

// ── Libreta ───────────────────────────────────────────────────────────────────
const NB_RING = "#907840";                // argolla bronce
const NB_RED  = "#C84030";               // línea de margen roja
const NB_LINE = "rgba(80,110,190,0.28)"; // renglón azul tenue
const NB_INK  = "rgba(44,22,0,0.55)";   // tinta para líneas de texto

// ── Compartido ────────────────────────────────────────────────────────────────
const CLS = "absolute inset-0 w-full h-full";
const NS  = "http://www.w3.org/2000/svg";
const VB  = "0 0 200 172";

// ─── 1. Variedades — dos tomates en una vid ───────────────────────────────────

export const IllustrationVariedad = () => (
  <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Vid */}
    <path d="M55 22 Q105 10 148 20" stroke={E2} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5,4"/>
    {/* Hoja en la vid */}
    <path d="M105 14 Q108 4 118 8 Q112 16 105 14Z" stroke={G1} strokeWidth="1.4" fill={G2}/>

    {/* Tomate grande */}
    <circle cx="68" cy="112" r="52" stroke={INK} strokeWidth="2" fill={R1}/>
    <path d="M48 62 Q68 52 88 62 Q80 72 68 69 Q56 72 48 62Z" stroke={G1} strokeWidth="1.8" fill={G1}/>
    <path d="M68 52 Q65 38 58 28" stroke={E1} strokeWidth="2" strokeLinecap="round"/>
    <path d="M58 28 Q44 20 38 32 Q50 34 58 28Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    {/* Costillas */}
    <path d="M68 63 Q61 87 68 112" stroke={INK2} strokeWidth="1.2"/>
    <path d="M68 63 Q75 87 68 112" stroke={INK2} strokeWidth="1.2"/>

    {/* Tomate pequeño */}
    <circle cx="152" cy="80" r="36" stroke={INK} strokeWidth="1.8" fill={R2}/>
    <path d="M136 48 Q152 40 168 48 Q162 56 152 54 Q142 56 136 48Z" stroke={G1} strokeWidth="1.5" fill={G1}/>
    <path d="M152 40 Q150 30 144 22" stroke={E1} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M144 22 Q132 16 128 26 Q138 28 144 22Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
  </svg>
);

// ─── 2. Mi huerto — regadera con brotes ──────────────────────────────────────

export const IllustrationHuerto = () => (
  <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Cuerpo de la regadera — terracota */}
    <path d="M35 148 L42 78 L138 78 L145 148 Z" stroke={INK} strokeWidth="2" strokeLinejoin="round" fill={TC1}/>
    {/* Asa */}
    <path d="M62 78 Q55 50 72 42 Q100 34 128 42 Q142 52 136 78"
      stroke={INK} strokeWidth="2" strokeLinecap="round"/>
    {/* Pico */}
    <path d="M138 94 Q165 82 178 66 Q184 58 186 52" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
    {/* Cabezal rociador */}
    <ellipse cx="186" cy="50" rx="9" ry="6" stroke={INK} strokeWidth="1.5" transform="rotate(-20 186 50)" fill={TC2}/>
    {/* Gotas de agua — azul */}
    <path d="M178 64 L177 76" stroke={B1} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M185 61 L184 74" stroke={B1} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M171 68 L170 80" stroke={B1} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M165 72 L164 83" stroke={B1} strokeWidth="2.2" strokeLinecap="round"/>
    {/* Suelo */}
    <path d="M8 158 L80 158" stroke={E1} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Brotes — verde */}
    <path d="M18 158 Q16 144 14 132 M15 142 Q10 136 7 139" stroke={G1} strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 158 Q36 142 33 130 M35 142 Q30 136 27 139" stroke={G2} strokeWidth="2" strokeLinecap="round"/>
    <path d="M58 158 Q57 143 55 133 M56 142 Q62 136 65 139" stroke={G1} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── 3. Comunidad — girasol ───────────────────────────────────────────────────

export const IllustrationComunidad = () => {
  const cx = 100, cy = 82, inner = 24, outer = 48;
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const x1 = (cx + Math.cos(a) * inner).toFixed(1);
    const y1 = (cy + Math.sin(a) * inner).toFixed(1);
    const x2 = (cx + Math.cos(a) * outer).toFixed(1);
    const y2 = (cy + Math.sin(a) * outer).toFixed(1);
    const lx = (cx + Math.cos(a + 0.38) * (inner + (outer - inner) * 0.65)).toFixed(1);
    const ly = (cy + Math.sin(a + 0.38) * (inner + (outer - inner) * 0.65)).toFixed(1);
    const rx = (cx + Math.cos(a - 0.38) * (inner + (outer - inner) * 0.65)).toFixed(1);
    const ry = (cy + Math.sin(a - 0.38) * (inner + (outer - inner) * 0.65)).toFixed(1);
    return `M${x1},${y1} Q${lx},${ly} ${x2},${y2} Q${rx},${ry} ${x1},${y1}`;
  });
  return (
    <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
      {/* Pétalos — amarillo girasol */}
      {petals.map((d, i) => (
        <path key={i} d={d} stroke={E2} strokeWidth="1.5" fill={Y1}/>
      ))}
      {/* Centro */}
      <circle cx={cx} cy={cy} r={inner} stroke={INK} strokeWidth="1.8" fill="#5A3A10"/>
      <circle cx={cx} cy={cy} r={inner * 0.55} stroke={INK} strokeWidth="1.2" fill="#3A2008"/>
      {/* Tallo */}
      <path d={`M${cx} ${cy + inner} Q${cx - 3} 132 ${cx - 5} 158`} stroke={G1} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Hojas */}
      <path d={`M${cx - 2} 118 Q84 108 80 118 Q88 126 ${cx - 2} 118Z`} stroke={G1} strokeWidth="1.5" fill={G2}/>
      <path d={`M${cx - 4} 134 Q118 124 122 134 Q114 142 ${cx - 4} 134Z`} stroke={G1} strokeWidth="1.5" fill={G2}/>
    </svg>
  );
};

// ─── 4. Receta — olla con vapor y hierbas ─────────────────────────────────────

export const IllustrationReceta = () => (
  <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Cuerpo de la olla — azul pizarra */}
    <path d="M52 105 Q44 150 100 155 Q156 150 148 105 Z" stroke={INK} strokeWidth="2" fill={POT}/>
    {/* Borde superior */}
    <path d="M45 105 Q100 96 155 105" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill={POT2}/>
    {/* Asas */}
    <path d="M45 105 Q34 105 34 118 Q34 130 45 130" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M155 105 Q166 105 166 118 Q166 130 155 130" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Vapor — azul grisáceo */}
    <path d="M76 96 Q72 80 76 66 Q80 52 76 38" stroke="rgba(160,200,225,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M100 93 Q96 76 100 62 Q104 48 100 32" stroke="rgba(160,200,225,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M124 96 Q120 80 124 66 Q128 52 124 38" stroke="rgba(160,200,225,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Hierba izquierda (romero) */}
    <path d="M26 88 Q23 68 26 50" stroke={G1} strokeWidth="1.8" strokeLinecap="round"/>
    {[58, 65, 73, 80, 88].map((y, i) => (
      <path key={i} d={`M26 ${y} Q${18 + i} ${y - 4} ${16 + i} ${y + 2}`}
        stroke={G2} strokeWidth="1.5" strokeLinecap="round"/>
    ))}
    {/* Hierba derecha */}
    <path d="M174 88 Q177 68 174 50" stroke={G1} strokeWidth="1.8" strokeLinecap="round"/>
    {[58, 65, 73, 80, 88].map((y, i) => (
      <path key={i} d={`M174 ${y} Q${182 - i} ${y - 4} ${184 - i} ${y + 2}`}
        stroke={G2} strokeWidth="1.5" strokeLinecap="round"/>
    ))}
  </svg>
);

// ─── 5. Calendario — luna y planta ───────────────────────────────────────────

export const IllustrationCalendario = () => (
  <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Luna creciente — dorado pálido */}
    <path
      d="M92 22 Q56 52 66 105 Q76 148 114 158 Q72 148 62 108 Q50 62 84 28 Q88 24 92 22Z"
      stroke={E2} strokeWidth="1.8" fill={Y2}
    />
    {/* Estrellas */}
    {[[148, 28], [164, 52], [156, 82], [140, 102], [168, 108], [136, 46]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x},${y})`} opacity={0.75 - i * 0.07}>
        <line x1="-4" y1="0" x2="4" y2="0" stroke={Y2} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="0" y1="-4" x2="0" y2="4" stroke={Y2} strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    ))}
    {/* Planta / brote */}
    <path d="M135 158 Q133 136 131 116 Q129 98 132 80" stroke={G1} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M131 96 Q119 85 115 95 Q123 101 131 96Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    <path d="M130 112 Q142 102 146 111 Q138 117 130 112Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    <path d="M129 128 Q117 122 115 131 Q123 134 129 128Z" stroke={G1} strokeWidth="1.5" fill={G3}/>
    {/* Tierra */}
    {[112, 124, 136, 148].map((x, i) => (
      <circle key={i} cx={x} cy={160} r="2.5" fill={E1}/>
    ))}
  </svg>
);

// ─── 6. Planta nativa — rama con hojas y bayas ───────────────────────────────

export const IllustrationNativa = () => (
  <svg fill="none" xmlns={NS} viewBox={VB} preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Rama principal */}
    <path d="M12 165 Q52 132 95 102 Q138 72 178 42" stroke={E1} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Ramas secundarias */}
    <path d="M60 128 Q50 110 46 92" stroke={E2} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M95 102 Q90 83 88 66" stroke={E2} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M134 75 Q140 58 144 44" stroke={E2} strokeWidth="1.6" strokeLinecap="round"/>

    {/* Hojas rama 1 */}
    <path d="M46 92 Q34 80 38 68 Q50 78 46 92Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    <path d="M46 92 Q56 80 62 84 Q54 92 46 92Z" stroke={G1} strokeWidth="1.5" fill={G3}/>
    <path d="M48 108 Q36 100 36 110 Q44 114 48 108Z" stroke={G1} strokeWidth="1.4" fill={G2}/>

    {/* Hojas rama 2 */}
    <path d="M88 66 Q76 54 80 42 Q92 52 88 66Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    <path d="M88 66 Q98 54 104 58 Q96 66 88 66Z" stroke={G1} strokeWidth="1.5" fill={G3}/>
    <path d="M88 82 Q76 76 74 86 Q82 89 88 82Z" stroke={G1} strokeWidth="1.4" fill={G2}/>

    {/* Hojas punta */}
    <path d="M144 44 Q132 32 136 20 Q148 30 144 44Z" stroke={G1} strokeWidth="1.5" fill={G2}/>
    <path d="M144 44 Q154 32 160 36 Q152 44 144 44Z" stroke={G1} strokeWidth="1.5" fill={G3}/>

    {/* Bayas — borgoña y rojo */}
    <circle cx="66" cy="124" r="5.5" stroke={INK} strokeWidth="1.5" fill={BRY}/>
    <circle cx="76" cy="117" r="4.5" stroke={INK} strokeWidth="1.5" fill={R1}/>
    <circle cx="70" cy="132" r="4" stroke={INK} strokeWidth="1.5" fill={BRY}/>
    <circle cx="112" cy="97" r="5" stroke={INK} strokeWidth="1.5" fill={R1}/>
    <circle cx="122" cy="90" r="4" stroke={INK} strokeWidth="1.5" fill={BRY}/>
  </svg>
);

// ─── 7. Tarea — libreta con renglones y checkboxes ───────────────────────────

export const IllustrationTarea = () => (
  <svg fill="none" xmlns={NS} viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" className={CLS}>
    {/* Espiral / argollas — bronce */}
    {[22, 50, 78, 106, 134].map((cy, i) => (
      <ellipse key={i} cx="11" cy={cy} rx="7" ry="4" stroke={NB_RING} strokeWidth="1.6"/>
    ))}
    {/* Línea de margen roja */}
    <path d="M26 6 L26 154" stroke={NB_RED} strokeWidth="1.2"/>
    {/* Renglones azules */}
    {[22, 36, 50, 64, 78, 92, 106, 120, 134, 148].map((y, i) => (
      <path key={i} d={`M26 ${y} L192 ${y}`} stroke={NB_LINE} strokeWidth="0.9"/>
    ))}

    {/* Checkbox 1 — marcado ✓ */}
    <rect x="31" y="14" width="13" height="13" rx="2.5" stroke={NB_INK} strokeWidth="1.4"/>
    <path d="M33 20.5 L36 24 L44 16.5" stroke={G1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 20 L148 20" stroke={NB_INK} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M50 30 L110 30" stroke={NB_INK} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.5"/>

    {/* Checkbox 2 — marcado ✓ */}
    <rect x="31" y="42" width="13" height="13" rx="2.5" stroke={NB_INK} strokeWidth="1.4"/>
    <path d="M33 48.5 L36 52 L44 44.5" stroke={G1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 48 L165 48" stroke={NB_INK} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M50 58 L86 58" stroke={NB_INK} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.5"/>

    {/* Checkbox 3 — vacío */}
    <rect x="31" y="70" width="13" height="13" rx="2.5" stroke={NB_INK} strokeWidth="1.4"/>
    <path d="M50 76 L132 76" stroke={NB_INK} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M50 86 L98 86" stroke={NB_INK} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.5"/>

    {/* Checkbox 4 — vacío */}
    <rect x="31" y="98" width="13" height="13" rx="2.5" stroke={NB_INK} strokeWidth="1.4"/>
    <path d="M50 104 L152 104" stroke={NB_INK} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M50 114 L74 114" stroke={NB_INK} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.5"/>

    {/* Checkbox 5 — vacío */}
    <rect x="31" y="126" width="13" height="13" rx="2.5" stroke={NB_INK} strokeWidth="1.4"/>
    <path d="M50 132 L122 132" stroke={NB_INK} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M50 142 L90 142" stroke={NB_INK} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.5"/>

    {/* Hierba decorativa — esquina inferior derecha */}
    <path d="M174 150 Q170 138 167 126" stroke={G1} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M168 134 Q158 126 155 134 Q162 138 168 134Z" stroke={G1} strokeWidth="1.3" fill={G2}/>
    <path d="M170 144 Q180 136 184 144 Q177 149 170 144Z" stroke={G1} strokeWidth="1.3" fill={G2}/>
  </svg>
);
