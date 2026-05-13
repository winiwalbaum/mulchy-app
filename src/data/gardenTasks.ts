export type Season = "otoño" | "invierno" | "primavera" | "verano";

export interface GardenTask {
  id: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  season: Season;
  months: number[];
  category: "suelo" | "siembra" | "cosecha" | "poda" | "riego" | "plagas" | "planificación" | "compost" | "general";
  emoji: string;
  sourceUrl: string;
  sourceName: string;
}

export const gardenTasks: GardenTask[] = [
  // ═══════════════════════════════
  // OTOÑO – Toda la estación (Mar-May)
  // ═══════════════════════════════
  {
    id: "ot-01",
    title: "Preparar camas de cultivo con compost",
    title_en: "Prepare garden beds with compost",
    description: "Agrega una capa de 5-7 cm de compost sobre tus camas de cultivo sin picar la tierra. Como dice Wini Walbaum: 'La tierra no se pica'. Simplemente agrega compost fresco y deja que la microbiología del suelo haga su trabajo.",
    description_en: "Add a 5-7 cm layer of compost on top of your garden beds without tilling. As Wini Walbaum says: 'Don't dig the soil'. Simply add fresh compost and let soil biology do the work.",
    season: "otoño",
    months: [3, 4, 5],
    category: "suelo",
    emoji: "🌍",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-04",
    title: "Aplicar mulch grueso a camas vacías",
    title_en: "Apply thick mulch to empty beds",
    description: "Cubre toda tierra expuesta con una capa de 3-5 cm de mulch (paja, hojas secas, chips de madera). 'La tierra descubierta es antinatural. No existe por sí sola y cuando existe, la llamamos desierto.' – Wini Walbaum.",
    description_en: "Cover all exposed soil with a 3-5 cm layer of mulch (straw, dry leaves, wood chips). 'Bare soil is unnatural. It doesn't exist on its own and when it does, we call it desert.' – Wini Walbaum.",
    season: "otoño",
    months: [3, 4, 5],
    category: "suelo",
    emoji: "🍂",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-07",
    title: "Iniciar o voltear la compostera",
    title_en: "Start or turn the compost bin",
    description: "Aprovecha las hojas caídas para alimentar la compostera. Mezcla materiales verdes (restos de cocina) con secos (hojas, cartón) en proporción 1:3. El compost estará listo para primavera.",
    description_en: "Use fallen leaves to feed the compost bin. Mix green materials (kitchen scraps) with dry ones (leaves, cardboard) in a 1:3 ratio. Compost will be ready by spring.",
    season: "otoño",
    months: [3, 4, 5],
    category: "compost",
    emoji: "♻️",
    sourceUrl: "https://www.almanac.com/composting-101",
    sourceName: "The Old Farmer's Almanac"
  },

  // OTOÑO – Marzo
  {
    id: "ot-m03-01",
    title: "Cosechar los últimos frutos de verano",
    title_en: "Harvest the last summer fruits",
    description: "Recoge los últimos tomates, pimientos y berenjenas antes de que las heladas los dañen. Los tomates verdes pueden madurar dentro de casa envueltos en papel.",
    description_en: "Pick the last tomatoes, peppers and eggplants before frost damages them. Green tomatoes can ripen indoors wrapped in paper.",
    season: "otoño",
    months: [3],
    category: "cosecha",
    emoji: "🍅",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ot-m03-02",
    title: "Recoger y guardar semillas de verano",
    title_en: "Collect and save summer seeds",
    description: "Cosecha semillas de tus mejores plantas (tomates, porotos, flores). Sécalas bien y guárdalas en sobres etiquetados. 'La semilla lo es todo. Desde ella comienza la vida en nuestros huertos.' – Wini Walbaum.",
    description_en: "Harvest seeds from your best plants (tomatoes, beans, flowers). Dry them well and store in labeled envelopes. 'The seed is everything. Life in our gardens begins from it.' – Wini Walbaum.",
    season: "otoño",
    months: [3],
    category: "planificación",
    emoji: "🫘",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-m03-03",
    title: "Sembrar lechugas y rúcula de otoño",
    title_en: "Sow fall lettuce and arugula",
    description: "Marzo es el momento ideal para las primeras siembras de otoño: lechugas, rúcula, espinacas y acelgas. Temperaturas de 15-25°C son perfectas para la germinación de estas hojas.",
    description_en: "March is the ideal time for first fall sowings: lettuce, arugula, spinach and chard. Temperatures of 15-25°C are perfect for germinating these greens.",
    season: "otoño",
    months: [3],
    category: "siembra",
    emoji: "🥬",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-m03-04",
    title: "Limpiar y reorganizar bancales de verano",
    title_en: "Clean and reorganize summer beds",
    description: "Retira plantas de tomate, zapallito y pepino que terminaron su ciclo. Corta a ras de suelo sin arrancar raíces para no disturbar la microbiología del suelo.",
    description_en: "Remove tomato, squash and cucumber plants that finished their cycle. Cut at ground level without pulling roots to avoid disturbing soil biology.",
    season: "otoño",
    months: [3],
    category: "general",
    emoji: "🧹",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },

  // OTOÑO – Abril
  {
    id: "ot-m04-01",
    title: "Plantar ajos con la punta hacia arriba",
    title_en: "Plant garlic with tips pointing up",
    description: "Los ajos se plantan a 5 cm de profundidad con la punta hacia arriba. Temperatura ideal: 0° a 15°C. 'Siempre algo que huela abajo' en cada bancal. – Wini Walbaum.",
    description_en: "Plant garlic 5 cm deep with tips pointing up. Ideal temperature: 0° to 15°C. 'Always something that smells underground' in every bed. – Wini Walbaum.",
    season: "otoño",
    months: [4],
    category: "siembra",
    emoji: "🧄",
    sourceUrl: "https://www.almanac.com/plant/garlic",
    sourceName: "Un año en mi huerto – Wini Walbaum / The Old Farmer's Almanac"
  },
  {
    id: "ot-m04-02",
    title: "Sembrar habas y arvejas",
    title_en: "Sow fava beans and peas",
    description: "Abril es ideal para habas y arvejas que fijan nitrógeno en el suelo. Las habas toleran heladas suaves (10°-25°C). Siembra directa a 3 cm de profundidad.",
    description_en: "April is ideal for fava beans and peas that fix nitrogen in the soil. Fava beans tolerate light frost (10°-25°C). Direct sow at 3 cm depth.",
    season: "otoño",
    months: [4],
    category: "siembra",
    emoji: "🫘",
    sourceUrl: "https://www.almanac.com/plant/peas",
    sourceName: "Un año en mi huerto – Wini Walbaum / The Old Farmer's Almanac"
  },
  {
    id: "ot-m04-03",
    title: "Plantar bulbos de primavera",
    title_en: "Plant spring bulbs",
    description: "Tulipanes, narcisos, crocus y jacintos se plantan ahora para florecer en primavera. Entierrar a una profundidad de 2-3 veces el tamaño del bulbo.",
    description_en: "Tulips, daffodils, crocus and hyacinths are planted now to bloom in spring. Bury at a depth of 2-3 times the bulb size.",
    season: "otoño",
    months: [4],
    category: "siembra",
    emoji: "🌷",
    sourceUrl: "https://www.almanac.com/plant/tulips",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ot-m04-04",
    title: "Sembrar zanahorias y betarragas",
    title_en: "Sow carrots and beets",
    description: "Las raíces se siembran directo en la tierra ya que no les gusta el trasplante. Siembra a 1 cm de profundidad, mantén húmedo hasta la germinación (7-14 días).",
    description_en: "Root vegetables are sown directly in the ground as they don't like transplanting. Sow at 1 cm depth, keep moist until germination (7-14 days).",
    season: "otoño",
    months: [4],
    category: "siembra",
    emoji: "🥕",
    sourceUrl: "https://www.almanac.com/plant/carrots",
    sourceName: "Un año en mi huerto – Wini Walbaum / The Old Farmer's Almanac"
  },

  // OTOÑO – Mayo
  {
    id: "ot-m05-01",
    title: "Proteger plantas sensibles de heladas tempranas",
    title_en: "Protect sensitive plants from early frost",
    description: "En mayo pueden llegar las primeras heladas. Prepara coberturas de tela antihelada o campanas para proteger almácigos tiernos y hojas sensibles al frío.",
    description_en: "First frosts may arrive in May. Prepare frost cloth covers or cloches to protect tender seedlings and cold-sensitive leaves.",
    season: "otoño",
    months: [5],
    category: "general",
    emoji: "🧊",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-m05-02",
    title: "Sembrar cebollas y puerros",
    title_en: "Sow onions and leeks",
    description: "Las cebollas y puerros van en mayo para cosecha en verano. Siembra en almácigos profundos o directa en la tierra a 2 cm de profundidad.",
    description_en: "Onions and leeks go in May for summer harvest. Sow in deep seed trays or directly in the ground at 2 cm depth.",
    season: "otoño",
    months: [5],
    category: "siembra",
    emoji: "🧅",
    sourceUrl: "https://www.almanac.com/plant/onions",
    sourceName: "Un año en mi huerto – Wini Walbaum / The Old Farmer's Almanac"
  },
  {
    id: "ot-m05-03",
    title: "Cosechar primeras hojas de otoño",
    title_en: "Harvest first fall greens",
    description: "Las lechugas y rúculas sembradas en marzo ya deberían estar listas para cosechar hoja a hoja. No arranques la planta completa; corta las hojas externas y seguirá produciendo.",
    description_en: "Lettuce and arugula sown in March should be ready for leaf-by-leaf harvesting. Don't pull the whole plant; cut outer leaves and it will keep producing.",
    season: "otoño",
    months: [5],
    category: "cosecha",
    emoji: "🥗",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ot-m05-04",
    title: "Reducir frecuencia de riego",
    title_en: "Reduce watering frequency",
    description: "Con las temperaturas más bajas y la evaporación reducida, disminuye la frecuencia de riego. Usa siempre la 'prueba del dedo' antes de regar.",
    description_en: "With lower temperatures and reduced evaporation, decrease watering frequency. Always use the 'finger test' before watering.",
    season: "otoño",
    months: [5],
    category: "riego",
    emoji: "💧",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },

  // ═══════════════════════════════
  // INVIERNO – Toda la estación (Jun-Ago)
  // ═══════════════════════════════
  {
    id: "in-07",
    title: "Enmendar el suelo con compost",
    title_en: "Amend soil with compost",
    description: "Agrega compost maduro sobre las camas de cultivo. 'Alimentamos al suelo y el suelo alimenta a nuestras plantas.' No picar, solo esparcir encima.",
    description_en: "Add mature compost on top of garden beds. 'We feed the soil and the soil feeds our plants.' Don't till, just spread on top.",
    season: "invierno",
    months: [6, 7, 8],
    category: "suelo",
    emoji: "🌍",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "in-03",
    title: "Proteger plantas del frío con mulch",
    title_en: "Protect plants from cold with mulch",
    description: "Agrega una capa extra de mulch alrededor de plantas sensibles. Las heladas no solo afectan por temperatura sino por duración. – Wini Walbaum.",
    description_en: "Add an extra layer of mulch around sensitive plants. Frost damage depends not only on temperature but also on duration. – Wini Walbaum.",
    season: "invierno",
    months: [6, 7, 8],
    category: "general",
    emoji: "❄️",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },

  // INVIERNO – Junio
  {
    id: "in-m06-01",
    title: "Podar árboles frutales de hoja caduca",
    title_en: "Prune deciduous fruit trees",
    description: "Con las hojas caídas puedes ver la estructura del árbol. Elimina ramas cruzadas, enfermas o que crecen hacia adentro. Ideal para manzanos, perales y ciruelos.",
    description_en: "With leaves fallen you can see the tree structure. Remove crossing, diseased or inward-growing branches. Ideal for apple, pear and plum trees.",
    season: "invierno",
    months: [6],
    category: "poda",
    emoji: "✂️",
    sourceUrl: "https://www.almanac.com/pruning-guide",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "in-m06-02",
    title: "Cosechar brócoli y coliflor",
    title_en: "Harvest broccoli and cauliflower",
    description: "Cosecha las cabezas de brócoli cuando los botones estén firmes y antes de que se abran las flores. El brócoli da brotes laterales adicionales después del corte principal.",
    description_en: "Harvest broccoli heads when buds are firm and before flowers open. Broccoli produces additional side shoots after the main cut.",
    season: "invierno",
    months: [6],
    category: "cosecha",
    emoji: "🥦",
    sourceUrl: "https://www.almanac.com/plant/broccoli",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "in-m06-03",
    title: "Hacer mantención de herramientas",
    title_en: "Maintain garden tools",
    description: "Limpia, afila y engrasa tus herramientas de jardín. Un buen momento para reparar tutores, cercos y estructuras de soporte.",
    description_en: "Clean, sharpen and oil your garden tools. A good time to repair stakes, fences and support structures.",
    season: "invierno",
    months: [6],
    category: "general",
    emoji: "🔧",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },

  // INVIERNO – Julio
  {
    id: "in-m07-01",
    title: "Planificar el huerto con Square Foot",
    title_en: "Plan garden with Square Foot method",
    description: "Dibuja tu huerto usando el método Square Foot: divide tus bancales en cuadrantes de 30×30 cm. Busca cuántas plantas caben por cuadrante (16 zanahorias, 4 lechugas, 1 tomate).",
    description_en: "Draw your garden using Square Foot method: divide beds into 30×30 cm squares. Check how many plants fit per square (16 carrots, 4 lettuce, 1 tomato).",
    season: "invierno",
    months: [7],
    category: "planificación",
    emoji: "📐",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "in-m07-02",
    title: "Pedir y organizar semillas para primavera",
    title_en: "Order and organize seeds for spring",
    description: "Revisa tu inventario de semillas, compra las que te falten y organízalas por fecha de siembra. Es el momento de investigar variedades nuevas.",
    description_en: "Check your seed inventory, buy what you're missing and organize by sowing date. It's time to research new varieties.",
    season: "invierno",
    months: [7],
    category: "planificación",
    emoji: "📦",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "in-m07-03",
    title: "Cosechar kale y coles de Bruselas",
    title_en: "Harvest kale and Brussels sprouts",
    description: "El kale y las coles de Bruselas mejoran su sabor después de las heladas suaves. Cosecha las hojas externas del kale y los brotes de abajo hacia arriba en las coles.",
    description_en: "Kale and Brussels sprouts improve their flavor after light frosts. Harvest outer kale leaves and sprouts from bottom to top on Brussels sprouts.",
    season: "invierno",
    months: [7],
    category: "cosecha",
    emoji: "🥬",
    sourceUrl: "https://www.almanac.com/plant/kale",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "in-m07-04",
    title: "Podar vides y berries",
    title_en: "Prune grapevines and berries",
    description: "Julio es ideal para podar vides, frambuesas y arándanos. Elimina cañas viejas y deja las más vigorosas para la próxima temporada.",
    description_en: "July is ideal for pruning grapevines, raspberries and blueberries. Remove old canes and keep the most vigorous for next season.",
    season: "invierno",
    months: [7],
    category: "poda",
    emoji: "🍇",
    sourceUrl: "https://www.almanac.com/pruning-guide",
    sourceName: "The Old Farmer's Almanac"
  },

  // INVIERNO – Agosto
  {
    id: "in-m08-01",
    title: "Preparar almácigos de tomate en interior",
    title_en: "Start indoor tomato seedlings",
    description: "Comienza los almácigos de tomates, pimientos y berenjenas 6-8 semanas antes de la última helada. Usa el método del platito de Wini: papel absorbente húmedo y bolsa plástica.",
    description_en: "Start tomato, pepper and eggplant seedlings 6-8 weeks before last frost. Use Wini's saucer method: moist paper towel and plastic bag.",
    season: "invierno",
    months: [8],
    category: "siembra",
    emoji: "🌱",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "in-m08-02",
    title: "Sembrar habas de primavera temprana",
    title_en: "Sow early spring fava beans",
    description: "Las habas de siembra tardía de invierno estarán listas en primavera. Siembra directa a 5 cm de profundidad, a 15 cm de distancia.",
    description_en: "Late winter fava beans will be ready in spring. Direct sow at 5 cm depth, 15 cm apart.",
    season: "invierno",
    months: [8],
    category: "siembra",
    emoji: "🫘",
    sourceUrl: "https://www.almanac.com/plant/peas",
    sourceName: "Un año en mi huerto – Wini Walbaum / The Old Farmer's Almanac"
  },
  {
    id: "in-m08-03",
    title: "Preparar estructuras de soporte",
    title_en: "Prepare support structures",
    description: "Instala o repara tutores, cañas y alambres para las plantas trepadoras que vendrán en primavera. Mejor hacerlo ahora que con las plantas creciendo.",
    description_en: "Install or repair stakes, canes and wires for climbing plants coming in spring. Better to do it now than with plants growing.",
    season: "invierno",
    months: [8],
    category: "general",
    emoji: "🏗️",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "in-m08-04",
    title: "Aplicar azufre o cal al suelo si es necesario",
    title_en: "Apply sulfur or lime to soil if needed",
    description: "Si tu suelo es muy ácido o alcalino, agosto es buen momento para corregir el pH. El azufre acidifica y la cal alcaliniza. Haz un test de pH antes de aplicar.",
    description_en: "If your soil is too acidic or alkaline, August is a good time to correct pH. Sulfur acidifies and lime alkalinizes. Do a pH test before applying.",
    season: "invierno",
    months: [8],
    category: "suelo",
    emoji: "🧪",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },

  // ═══════════════════════════════
  // PRIMAVERA – Toda la estación (Sep-Nov)
  // ═══════════════════════════════
  {
    id: "pr-04",
    title: "Ajustar el riego de primavera",
    title_en: "Adjust spring watering",
    description: "Usa la 'prueba del dedo' de Wini: mete un dedo 4 cm en la tierra. Si sale seco, riega. Si sale húmedo, espera. Como mínimo, ~2.4 litros por semana por planta.",
    description_en: "Use Wini's 'finger test': insert a finger 4 cm into soil. If dry, water. If moist, wait. Minimum ~2.4 liters per week per plant.",
    season: "primavera",
    months: [9, 10, 11],
    category: "riego",
    emoji: "💧",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-07",
    title: "Vigilar plagas tempranas",
    title_en: "Watch for early pests",
    description: "Revisa las hojas por debajo buscando pulgones, orugas o huevos de insectos. Retíralos a mano o con agua jabonosa. Un huerto diverso reduce naturalmente las plagas.",
    description_en: "Check leaf undersides for aphids, caterpillars or insect eggs. Remove by hand or with soapy water. A diverse garden naturally reduces pests.",
    season: "primavera",
    months: [9, 10, 11],
    category: "plagas",
    emoji: "🐛",
    sourceUrl: "https://www.almanac.com/pest/aphids",
    sourceName: "The Old Farmer's Almanac"
  },

  // PRIMAVERA – Septiembre
  {
    id: "pr-m09-01",
    title: "Trasplantar almácigos de verano al huerto",
    title_en: "Transplant summer seedlings to the garden",
    description: "Cuando pase el riesgo de heladas, trasplanta tomates, pimientos y berenjenas. Hazlo al atardecer para reducir el estrés. – Wini Walbaum.",
    description_en: "When frost risk has passed, transplant tomatoes, peppers and eggplants. Do it at dusk to reduce stress. – Wini Walbaum.",
    season: "primavera",
    months: [9],
    category: "siembra",
    emoji: "🌿",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m09-02",
    title: "Cosechar las últimas verduras de frío",
    title_en: "Harvest the last cool-season vegetables",
    description: "Termina de cosechar lechugas, espinacas y habas de invierno antes de que el calor las haga florecer. Usa el espacio liberado para cultivos de verano.",
    description_en: "Finish harvesting winter lettuce, spinach and fava beans before heat makes them bolt. Use freed space for summer crops.",
    season: "primavera",
    months: [9],
    category: "cosecha",
    emoji: "🥬",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "pr-m09-03",
    title: "Agregar aromáticas a los bancales",
    title_en: "Add aromatic herbs to garden beds",
    description: "Planta albahaca, cilantro, perejil y eneldo entre tus hortalizas. 'Nuestros bancales siempre deberían tener aromáticas que repelen pulgones y mosquita blanca.' – Wini Walbaum.",
    description_en: "Plant basil, cilantro, parsley and dill among your vegetables. 'Our beds should always have aromatics that repel aphids and whitefly.' – Wini Walbaum.",
    season: "primavera",
    months: [9],
    category: "siembra",
    emoji: "🌿",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m09-04",
    title: "Sembrar flores para polinizadores",
    title_en: "Sow flowers for pollinators",
    description: "Siembra girasoles, cosmos, zinnias y caléndulas. 'Las flores son importantísimas dentro del huerto.' – Wini Walbaum.",
    description_en: "Sow sunflowers, cosmos, zinnias and marigolds. 'Flowers are extremely important in the garden.' – Wini Walbaum.",
    season: "primavera",
    months: [9],
    category: "siembra",
    emoji: "🌻",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },

  // PRIMAVERA – Octubre
  {
    id: "pr-m10-01",
    title: "Siembra directa de zapallitos y porotos",
    title_en: "Direct sow squash and beans",
    description: "Cuando la tierra está cálida (>18°C), siembra directamente zapallitos, porotos, maíz y pepinos. – Wini Walbaum.",
    description_en: "When soil is warm (>18°C), direct sow squash, beans, corn and cucumbers. – Wini Walbaum.",
    season: "primavera",
    months: [10],
    category: "siembra",
    emoji: "🎃",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m10-02",
    title: "Instalar tutores y soportes",
    title_en: "Install stakes and supports",
    description: "Coloca tutores para tomates cuando superen 40 cm. Instala estructuras para porotos trepadores y pepinos. Es más fácil ahora que cuando las plantas estén grandes.",
    description_en: "Place stakes for tomatoes when they exceed 40 cm. Install structures for climbing beans and cucumbers. It's easier now than when plants are large.",
    season: "primavera",
    months: [10],
    category: "general",
    emoji: "🏗️",
    sourceUrl: "https://www.almanac.com/plant/tomatoes",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "pr-m10-03",
    title: "Abonar tomates y pimientos trasplantados",
    title_en: "Fertilize transplanted tomatoes and peppers",
    description: "Aplica humus de lombriz o compost alrededor de los tomates y pimientos trasplantados el mes anterior. Riega después de abonar.",
    description_en: "Apply worm castings or compost around tomatoes and peppers transplanted last month. Water after fertilizing.",
    season: "primavera",
    months: [10],
    category: "suelo",
    emoji: "🌍",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m10-04",
    title: "Sembrar sandías y melones",
    title_en: "Sow watermelons and melons",
    description: "Si el suelo ya está cálido, siembra sandías y melones en un lugar soleado. Necesitan mucho espacio (1.5 m entre plantas) y riego constante.",
    description_en: "If soil is already warm, sow watermelons and melons in a sunny spot. They need lots of space (1.5 m between plants) and constant watering.",
    season: "primavera",
    months: [10],
    category: "siembra",
    emoji: "🍉",
    sourceUrl: "https://www.almanac.com/plant/watermelon",
    sourceName: "The Old Farmer's Almanac"
  },

  // PRIMAVERA – Noviembre
  {
    id: "pr-m11-01",
    title: "Desbrotar chupones de tomates",
    title_en: "Remove tomato suckers",
    description: "Elimina los brotes que crecen entre el tallo principal y las ramas (chupones axilares) en tomates indeterminados. Esto concentra la energía en los frutos.",
    description_en: "Remove shoots growing between the main stem and branches (axillary suckers) on indeterminate tomatoes. This concentrates energy in the fruits.",
    season: "primavera",
    months: [11],
    category: "poda",
    emoji: "✂️",
    sourceUrl: "https://www.almanac.com/plant/tomatoes",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "pr-m11-02",
    title: "Aplicar mulch de verano",
    title_en: "Apply summer mulch",
    description: "Con el calor acercándose, agrega una capa gruesa de mulch alrededor de todas las plantas. Reduce evaporación y mantiene raíces frescas.",
    description_en: "With heat approaching, add a thick layer of mulch around all plants. Reduces evaporation and keeps roots cool.",
    season: "primavera",
    months: [11],
    category: "suelo",
    emoji: "🍂",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m11-03",
    title: "Hacer siembra escalonada de lechugas",
    title_en: "Succession sow lettuce",
    description: "Siembra un puñado de lechugas cada 2-3 semanas para tener cosecha continua todo el verano. En noviembre aún puedes sembrar variedades resistentes al calor.",
    description_en: "Sow a handful of lettuce every 2-3 weeks for continuous harvest throughout summer. In November you can still sow heat-resistant varieties.",
    season: "primavera",
    months: [11],
    category: "siembra",
    emoji: "🥬",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "pr-m11-04",
    title: "Revisar y ajustar sistema de riego",
    title_en: "Check and adjust irrigation system",
    description: "Verifica que mangueras, goteros y aspersores funcionen bien antes de las altas temperaturas. Instala temporizadores si es posible.",
    description_en: "Check that hoses, drippers and sprinklers work well before high temperatures. Install timers if possible.",
    season: "primavera",
    months: [11],
    category: "riego",
    emoji: "🔧",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },

  // ═══════════════════════════════
  // VERANO – Toda la estación (Dic-Feb)
  // ═══════════════════════════════
  {
    id: "ve-04",
    title: "Mantener el mulch en buen estado",
    title_en: "Keep mulch in good condition",
    description: "Reponer el mulch que se haya descompuesto, especialmente en verano cuando la evaporación es máxima. Una capa de 3 cm reduce significativamente la necesidad de riego.",
    description_en: "Replace mulch that has decomposed, especially in summer when evaporation is at its peak. A 3 cm layer significantly reduces watering needs.",
    season: "verano",
    months: [12, 1, 2],
    category: "suelo",
    emoji: "🍂",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ve-01",
    title: "Regar profundo y con menos frecuencia",
    title_en: "Water deeply and less frequently",
    description: "Cuando las plantas están dando fruto, riega por más rato y con menos frecuencia. Esto incentiva raíces profundas. – Wini Walbaum.",
    description_en: "When plants are fruiting, water longer and less frequently. This encourages deep roots. – Wini Walbaum.",
    season: "verano",
    months: [12, 1, 2],
    category: "riego",
    emoji: "💧",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },

  // VERANO – Diciembre
  {
    id: "ve-m12-01",
    title: "Cosechar primeros tomates y pepinos",
    title_en: "Harvest first tomatoes and cucumbers",
    description: "Los primeros tomates cherry y pepinos de la temporada deberían estar listos. Cosecha regularmente para estimular mayor producción.",
    description_en: "First cherry tomatoes and cucumbers of the season should be ready. Harvest regularly to stimulate greater production.",
    season: "verano",
    months: [12],
    category: "cosecha",
    emoji: "🍅",
    sourceUrl: "https://www.almanac.com/plant/tomatoes",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m12-02",
    title: "Polinización manual de cucurbitáceas",
    title_en: "Hand-pollinate cucurbits",
    description: "Si notas que zapallitos o pepinos no cuajan fruto, poliniza manualmente con un pincel: de flores masculinas a las femeninas (las que tienen un pequeño fruto en la base).",
    description_en: "If squash or cucumbers aren't setting fruit, hand-pollinate with a brush: from male to female flowers (the ones with a small fruit at the base).",
    season: "verano",
    months: [12],
    category: "general",
    emoji: "🐝",
    sourceUrl: "https://www.almanac.com/plant/zucchini",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m12-03",
    title: "Podar y despuntar tomates",
    title_en: "Prune and top tomatoes",
    description: "Elimina los chupones de tomates indeterminados. Poda las hojas inferiores que toquen el suelo para prevenir enfermedades fúngicas.",
    description_en: "Remove suckers from indeterminate tomatoes. Prune lower leaves touching the ground to prevent fungal diseases.",
    season: "verano",
    months: [12],
    category: "poda",
    emoji: "✂️",
    sourceUrl: "https://www.almanac.com/plant/tomatoes",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m12-04",
    title: "Instalar malla sombra si es necesario",
    title_en: "Install shade cloth if needed",
    description: "Si las temperaturas superan los 35°C, instala malla sombra sobre cultivos sensibles como lechugas y espinacas. Nunca regar con sol directo sobre las hojas.",
    description_en: "If temperatures exceed 35°C, install shade cloth over sensitive crops like lettuce and spinach. Never water with direct sun on the leaves.",
    season: "verano",
    months: [12],
    category: "general",
    emoji: "☀️",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },

  // VERANO – Enero
  {
    id: "ve-m01-01",
    title: "Cosechar la abundancia del verano",
    title_en: "Harvest summer abundance",
    description: "Tomates, pimientos, berenjenas, zapallitos, pepinos, porotos verdes y maíz están en su punto máximo. Cosecha cada 2-3 días para mantener la producción.",
    description_en: "Tomatoes, peppers, eggplants, squash, cucumbers, green beans and corn are at their peak. Harvest every 2-3 days to maintain production.",
    season: "verano",
    months: [1],
    category: "cosecha",
    emoji: "🧺",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m01-02",
    title: "Hacer conservas y deshidratar",
    title_en: "Make preserves and dehydrate",
    description: "Con la abundancia de enero, conserva tomates, pimientos y hierbas. Seca aromáticas colgándolas boca abajo. Congela el excedente.",
    description_en: "With January's abundance, preserve tomatoes, peppers and herbs. Dry aromatics by hanging them upside down. Freeze the surplus.",
    season: "verano",
    months: [1],
    category: "cosecha",
    emoji: "🫙",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m01-03",
    title: "Combatir el calor extremo",
    title_en: "Combat extreme heat",
    description: "Riega temprano en la mañana para reducir evaporación. Aumenta la frecuencia de riego en olas de calor. Las plantas con fruto necesitan más agua.",
    description_en: "Water early in the morning to reduce evaporation. Increase watering frequency during heat waves. Fruiting plants need more water.",
    season: "verano",
    months: [1],
    category: "riego",
    emoji: "🌡️",
    sourceUrl: "https://www.almanac.com/gardening/growing-guides",
    sourceName: "The Old Farmer's Almanac"
  },
  {
    id: "ve-m01-04",
    title: "Vigilar plagas de verano",
    title_en: "Watch for summer pests",
    description: "Revisa por arañita roja, pulgones y orugas. El calor favorece su reproducción. Usa agua con jabón potásico o aceite de neem como control orgánico.",
    description_en: "Check for spider mites, aphids and caterpillars. Heat favors their reproduction. Use potassium soap water or neem oil for organic control.",
    season: "verano",
    months: [1],
    category: "plagas",
    emoji: "🐛",
    sourceUrl: "https://www.almanac.com/pest/aphids",
    sourceName: "The Old Farmer's Almanac"
  },

  // VERANO – Febrero
  {
    id: "ve-m02-01",
    title: "Iniciar almácigos de otoño",
    title_en: "Start fall seedlings",
    description: "Comienza los almácigos de brócoli, coliflor, repollo y coles de Bruselas. Así llegarán con buen tamaño cuando las temperaturas bajen en marzo.",
    description_en: "Start broccoli, cauliflower, cabbage and Brussels sprouts seedlings. They'll be good size when temperatures drop in March.",
    season: "verano",
    months: [2],
    category: "siembra",
    emoji: "🌱",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ve-m02-02",
    title: "Recoger semillas de las mejores plantas",
    title_en: "Collect seeds from best plants",
    description: "Selecciona tus plantas más sanas y productivas para guardar semillas. Deja algunos tomates y pimientos madurar completamente en la planta para semilla.",
    description_en: "Select your healthiest and most productive plants for seed saving. Let some tomatoes and peppers fully ripen on the plant for seeds.",
    season: "verano",
    months: [2],
    category: "planificación",
    emoji: "🫘",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ve-m02-03",
    title: "Planificar rotación de cultivos",
    title_en: "Plan crop rotation",
    description: "Antes de que termine la temporada, planifica dónde irá cada familia de cultivos la próxima temporada. No repitas la misma familia en el mismo lugar.",
    description_en: "Before the season ends, plan where each crop family will go next season. Don't repeat the same family in the same spot.",
    season: "verano",
    months: [2],
    category: "planificación",
    emoji: "📐",
    sourceUrl: "https://www.instagram.com/winiwalbaum/",
    sourceName: "Un año en mi huerto – Wini Walbaum"
  },
  {
    id: "ve-m02-04",
    title: "Cosechar últimas sandías y melones",
    title_en: "Harvest last watermelons and melons",
    description: "Las sandías están listas cuando el zarcillo más cercano al fruto se seca. Los melones se desprenden fácilmente del tallo cuando están maduros.",
    description_en: "Watermelons are ready when the tendril closest to the fruit dries. Melons detach easily from the stem when ripe.",
    season: "verano",
    months: [2],
    category: "cosecha",
    emoji: "🍉",
    sourceUrl: "https://www.almanac.com/plant/watermelon",
    sourceName: "The Old Farmer's Almanac"
  },
];

export const seasonConfig: Record<Season, { label: string; label_en: string; emoji: string; color: string; months: string; months_en: string }> = {
  otoño: { label: "Otoño", label_en: "Fall", emoji: "🍂", color: "bg-amber-100 text-amber-800 border-amber-200", months: "Marzo – Mayo", months_en: "March – May" },
  invierno: { label: "Invierno", label_en: "Winter", emoji: "❄️", color: "bg-blue-100 text-blue-800 border-blue-200", months: "Junio – Agosto", months_en: "June – August" },
  primavera: { label: "Primavera", label_en: "Spring", emoji: "🌸", color: "bg-green-100 text-green-800 border-green-200", months: "Septiembre – Noviembre", months_en: "September – November" },
  verano: { label: "Verano", label_en: "Summer", emoji: "☀️", color: "bg-orange-100 text-orange-800 border-orange-200", months: "Diciembre – Febrero", months_en: "December – February" },
};

export const taskCategories = [
  { value: "todas", label: "Todas", label_en: "All" },
  { value: "suelo", label: "🌍 Suelo", label_en: "🌍 Soil" },
  { value: "siembra", label: "🌱 Siembra", label_en: "🌱 Sowing" },
  { value: "cosecha", label: "🧺 Cosecha", label_en: "🧺 Harvest" },
  { value: "poda", label: "✂️ Poda", label_en: "✂️ Pruning" },
  { value: "riego", label: "💧 Riego", label_en: "💧 Watering" },
  { value: "plagas", label: "🐛 Plagas", label_en: "🐛 Pests" },
  { value: "planificación", label: "📐 Planificación", label_en: "📐 Planning" },
  { value: "compost", label: "♻️ Compost", label_en: "♻️ Compost" },
  { value: "general", label: "🔧 General", label_en: "🔧 General" },
];
