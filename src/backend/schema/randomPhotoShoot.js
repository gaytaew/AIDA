/**
 * Random Photo Shoot Schema
 * 
 * Parameters for random photo generation module.
 * Themes provide pools of random prompts; quality/format/style control output.
 */

// ═══════════════════════════════════════════════════════════════
// SECTION 1: THEMES (Random Prompt Pools)
// ═══════════════════════════════════════════════════════════════

export const RANDOM_THEMES = {
    id: 'theme',
    label: '🎨 Тематика',
    description: 'Категория для рандомного промпта',
    options: [
        {
            value: 'nature',
            label: 'Природа',
            prompts: [
                'A breathtaking mountain landscape at golden hour with dramatic cloud formations and a winding river below',
                'Dense ancient forest with sunbeams piercing through the canopy, moss-covered rocks and a hidden waterfall',
                'Vast lavender field at sunset in Provence with a lone tree silhouette against an amber sky',
                'Frozen lake surrounded by snow-capped peaks reflecting perfectly in the still water surface',
                'Tropical rainforest after rain with glistening leaves, exotic flowers and a rainbow through the mist',
                'Desert sand dunes at sunrise with long dramatic shadows and ripple patterns in warm orange light',
                'Cherry blossom trees in full bloom along a Japanese temple path with petals floating in the air',
                'Northern lights dancing over a Scandinavian fjord with a traditional wooden cabin on the shore',
                'Wild meadow full of poppies and cornflowers with a thunderstorm approaching in the background',
                'Volcanic landscape with steaming geysers, turquoise hot springs and black obsidian rock formations',
                'Autumn forest path covered in golden and crimson leaves with morning fog drifting between the trees',
                'Coral reef underwater scene with vibrant tropical fish and shafts of sunlight from the surface',
                'Scottish highland glen with heather in bloom, ancient stone walls and dramatic moody clouds',
                'Bamboo grove in morning mist with a stone lantern and a narrow path disappearing into the green',
                'Aerial view of a turquoise river delta meeting the ocean with fractal patterns in the sand'
            ]
        },
        {
            value: 'urban',
            label: 'Город',
            prompts: [
                'Neon-lit Tokyo alley at night with rain reflections on wet pavement and vending machine glow',
                'Aerial view of Manhattan skyline at blue hour with lights beginning to turn on across the city',
                'Narrow cobblestone street in old European town with hanging laundry and flower boxes on windowsills',
                'Modern glass skyscraper reflecting dramatic sunset clouds creating an abstract pattern',
                'Underground subway station with motion blur of arriving train and geometric tile patterns',
                'Rooftop garden oasis above a busy city with skyline visible in the warm evening light',
                'Foggy morning on the Golden Gate Bridge with the city emerging from low clouds behind it',
                'Bustling Asian night market with colorful food stalls, paper lanterns and crowds of people',
                'Art deco building facade at dusk with warm interior lights spilling through ornate windows',
                'Abandoned industrial warehouse being reclaimed by nature with vines and sunlight through broken roof',
                'Parisian cafe terrace on a rainy afternoon with reflections in puddles and warm interior glow',
                'Dubai marina at twilight with illuminated yachts and dramatic modern architecture skyline',
                'Venice canal in early morning golden light with a lone gondola and ancient palazzo facades',
                'Graffiti-covered tunnel with dramatic perspective and a figure silhouetted at the far end',
                'Snowy Moscow Red Square at night with Saint Basil Cathedral illuminated in vibrant colors'
            ]
        },
        {
            value: 'abstract',
            label: 'Абстракция',
            prompts: [
                'Swirling galaxy of liquid paint in deep blues, magentas and gold suspended in crystal clear water',
                'Geometric fractal pattern in metallic bronze and deep teal forming an infinite recursive tunnel',
                'Macro photography of soap bubble surface showing iridescent rainbow interference patterns',
                'Flowing silk fabric in motion creating organic curves and shadows in monochrome silver',
                'Crushed gemstone texture revealing layers of amethyst, quartz and obsidian under polarized light',
                'Digital glitch art with corrupted pixel patterns in neon pink, cyan and electric purple',
                'Aerial view of salt flats creating geometric patterns in white and deep rust orange',
                'Frozen moment of shattering glass with prismatic light refracting through suspended fragments',
                'Microscopic view of crystal formation growing in a supersaturated solution under UV light',
                'Smoke trails in still air creating organic swirling patterns lit by colored spotlights',
                'Oil and water macro with floating spheres creating a bokeh-like effect in pastel colors',
                'Topographic contour lines rendered as 3D landscape in copper wire against deep navy background',
                'Double exposure of forest canopy and flowing water creating a dreamlike ethereal texture',
                'Ferrofluid surface responding to magnetic fields forming sharp spikes in glossy black chrome',
                'Marbling art with flowing veins of gold leaf through deep emerald and midnight blue pigments'
            ]
        },
        {
            value: 'portrait',
            label: 'Портрет',
            prompts: [
                'Cinematic portrait of an elderly fisherman with weathered face, deep wrinkles and piercing blue eyes',
                'Fashion editorial portrait with bold makeup, geometric jewelry and dramatic directional lighting',
                'Street portrait of a musician playing saxophone in dim lamplight with bokeh city background',
                'Environmental portrait of an artist in their paint-splattered studio surrounded by canvases',
                'High fashion model with avant-garde headpiece in dramatic chiaroscuro studio lighting',
                'Documentary portrait of a tea ceremony master in traditional Japanese room with soft natural light',
                'Double exposure portrait merging a woman face with a blooming flower garden in soft pastel tones',
                'Dramatic low-key portrait of a ballet dancer mid-movement with single spotlight',
                'Portrait of a chef in professional kitchen with steam rising and warm tungsten lighting',
                'Ethereal portrait with fairy lights bokeh, soft focus and dreamy warm color palette',
                'Portrait of a blacksmith at work with sparks flying and the glow of hot metal illuminating the face',
                'Editorial beauty portrait with wet hair, dewy skin and minimal makeup in cold blue light',
                'Environmental portrait of an astronomer at a telescope under a star-filled night sky',
                'Candid portrait of a grandmother reading to grandchildren in warm afternoon window light',
                'Noir-style portrait with venetian blind shadows falling across a mysterious figure'
            ]
        },
        {
            value: 'architecture',
            label: 'Архитектура',
            prompts: [
                'Spiral staircase viewed from above creating a fibonacci pattern in warm marble and iron railings',
                'Brutalist concrete building against dramatic storm clouds with strong geometric shadows',
                'Gothic cathedral interior with stained glass windows casting colored light on stone floor',
                'Minimalist Japanese zen garden with raked sand patterns and a single perfect stone arrangement',
                'Futuristic parametric architecture with flowing organic curves in white and glass at blue hour',
                'Ancient Roman aqueduct stretching across a valley in warm golden afternoon light',
                'Modern museum interior with dramatic cantilever stairs and a single figure for scale',
                'Traditional Moroccan riad courtyard with intricate zellige tilework and a central fountain',
                'Abandoned art deco cinema interior with peeling gold leaf and crumbling ornate ceiling',
                'Glass and steel bridge reflecting in water below creating a perfect symmetrical composition',
                'Santorini blue-domed church against the deep blue Aegean Sea with white-washed walls',
                'Frank Lloyd Wright inspired house integrated into a waterfall setting at autumn',
                'Library with floor-to-ceiling bookshelves, rolling ladders and warm reading lamp glow',
                'Underground cave temple with carved columns and oil lamps casting warm flickering light',
                'Space station interior concept with circular corridors and Earth visible through windows'
            ]
        },
        {
            value: 'space',
            label: 'Космос',
            prompts: [
                'Nebula nursery where new stars are forming in pillars of cosmic gas in vivid blues and oranges',
                'Astronaut floating above Earth with the thin blue atmosphere line and city lights visible below',
                'Saturn rings in extreme detail with tiny shepherd moons visible and ring gaps illuminated',
                'Binary star system with accretion disk and powerful jets of plasma shooting into space',
                'Moon surface with Earth rising over the lunar horizon in the black void of space',
                'Supernova remnant expanding in filaments of glowing gas against a dense star field',
                'Space station orbiting a gas giant with banded atmosphere and multiple moons visible',
                'Comet approaching the inner solar system with a brilliant tail stretching across the star field',
                'Alien exoplanet landscape with twin suns setting over a crystalline mineral desert',
                'Milky Way core in extreme detail with dust lanes and millions of individual stars resolved',
                'Black hole warping space-time with gravitational lensing distorting background stars',
                'Mars rover exploring a vast canyon with layered red rock walls and a pale pink sky',
                'Interstellar space with a lone spacecraft approaching a distant spiral galaxy',
                'Planetary rings viewed from the surface of a moon with aurora borealis in the sky',
                'Asteroid mining operation with spacecraft extracting materials from a metallic asteroid'
            ]
        },
        {
            value: 'underwater',
            label: 'Подводный мир',
            prompts: [
                'Deep ocean bioluminescent creatures glowing in the abyss with jellyfish trailing light',
                'Sunken ancient Greek temple covered in coral with schools of fish swimming through columns',
                'Great white shark emerging from the deep blue with sunbeams filtering from the surface above',
                'Underwater cave system with crystal clear water revealing geological formations and stalactites',
                'Coral reef at golden hour with shafts of warm light illuminating a sea turtle gliding by',
                'Deep sea hydrothermal vent with unusual creatures surrounding the billowing mineral-rich water',
                'Kelp forest swaying in ocean currents with sea otters playing among the fronds',
                'Manta ray gliding gracefully through open water with tiny cleaning fish around it',
                'Underwater volcano eruption with lava meeting ocean water creating steam and new rock',
                'Frozen lake viewed from below the ice showing fractal patterns and trapped air bubbles',
                'Pod of dolphins swimming in synchronized formation with sun rays creating god beams',
                'Shipwreck covered in marine life with a school of barracuda circling overhead',
                'Microscopic plankton bloom with bioluminescent organisms creating a galaxy of underwater light',
                'Giant octopus in its den surrounded by collected shells and interesting objects',
                'Underwater waterfall illusion at a tropical island where sand cascades down a underwater cliff'
            ]
        },
        {
            value: 'fantasy',
            label: 'Фантастика',
            prompts: [
                'Floating sky islands connected by ancient rope bridges with waterfalls cascading into clouds below',
                'Dragon perched on a crystal mountain peak with aurora borealis painting the arctic sky behind',
                'Enchanted mushroom forest with bioluminescent fungi lighting a fairy path through the darkness',
                'Ancient tree of life towering above the clouds with civilizations built into its massive branches',
                'Steampunk airship docking at a cloud city with brass gears and Victorian architecture',
                'Underwater crystal palace with merfolk and bioluminescent architecture in the deep ocean',
                'Portal to another dimension opening in a stone circle with reality bending at the edges',
                'Phoenix rising from volcanic flames with wings of liquid fire against a star-filled sky',
                'Elven city built into a giant sequoia forest with bridges and platforms high in the canopy',
                'Clockwork automaton standing in a mechanical garden with brass flowers and copper butterflies',
                'Ice palace interior with frozen chandeliers refracting rainbow light through crystalline walls',
                'Witch cottage in a magical swamp with glowing potions and familiar spirits visible in windows',
                'Giant ancient library in a mountain with floating books and magical light illuminating shelves',
                'Cyber-organic temple where technology and nature merge into a biopunk cathedral',
                'Time-frozen battlefield with warriors suspended mid-combat in amber-colored energy field'
            ]
        },
        {
            value: 'food',
            label: 'Еда',
            prompts: [
                'Artisan sourdough bread being sliced with steam rising, crusty exterior and soft airy interior visible',
                'Elaborate Japanese ramen bowl with perfect soft-boiled egg, chashu pork and nori in rich broth',
                'Decadent chocolate lava cake mid-pour with molten center flowing out onto a dark slate plate',
                'Fresh sushi platter on a wooden board with wasabi, ginger and soy sauce in artistic arrangement',
                'Italian pizza fresh from a wood-fired oven with bubbling mozzarella and charred crust edges',
                'Colorful smoothie bowl with geometric fruit patterns, granola clusters and edible flowers',
                'Perfectly grilled steak with cross-hatch marks, herb butter melting and roasted vegetables',
                'French pastry tower of macarons in pastel gradient colors on a marble stand',
                'Street food tacos with slow-cooked meat, fresh cilantro, lime and homemade salsa verde',
                'Artisan cheese board with honeycomb, dried fruits, nuts and crusty bread on rustic wood',
                'Pouring maple syrup over a stack of fluffy pancakes with fresh berries and whipped cream',
                'Traditional Indian thali with colorful curries, rice, naan and chutneys on a copper plate',
                'Ice cream sundae with multiple scoops, hot fudge dripping, whipped cream and a cherry on top',
                'Fresh seafood platter with lobster, oysters, shrimp and lemon on crushed ice',
                'Morning coffee art latte being poured with intricate rosetta pattern forming in the cup'
            ]
        },
        {
            value: 'vintage',
            label: 'Винтаж',
            prompts: [
                'Antique typewriter on a wooden desk with scattered handwritten pages and a brass desk lamp',
                'Classic 1960s American diner interior with chrome stools, neon signs and checkered floor',
                'Victorian era laboratory with glass apparatus, leather-bound books and candlelight',
                'Art nouveau Parisian metro entrance with ornate ironwork against a misty morning backdrop',
                'Vintage apothecary shop with glass bottles of colored liquids and handwritten labels',
                'Old jazz club interior with smoky atmosphere, upright piano and dim spotlight on the stage',
                'Retro 1950s kitchen with pastel appliances, linoleum floor and a pie cooling on the counter',
                'Antique camera collection displayed on weathered wooden shelves with old photographs',
                'Victorian greenhouse filled with exotic plants, wrought iron frames and condensation on glass',
                'Classic barber shop with leather chair, straight razors and hot towel station in warm light',
                'Abandoned vintage cinema with velvet seats, ornate ceiling and a beam of projector light',
                'Old world map room with nautical instruments, brass compass and candlelit globe',
                'Vintage train compartment interior with velvet seats, brass fixtures and passing countryside',
                'Retro record store with vinyl records in wooden crates and concert posters on the walls',
                'Antique clockmaker workshop with gears, springs and magnifying tools under a desk lamp'
            ]
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: STYLE
// ═══════════════════════════════════════════════════════════════

export const RANDOM_STYLE = {
    id: 'style',
    label: '🎬 Стиль',
    description: 'Визуальный стиль генерации',
    options: [
        {
            value: 'photorealistic',
            label: 'Фотореализм',
            spec: 'STYLE: Ultra photorealistic. Shot on a professional full-frame camera. True-to-life colors, natural lighting, real-world physics.'
        },
        {
            value: 'cinematic',
            label: 'Кинематографический',
            spec: 'STYLE: Cinematic film look. Anamorphic lens flares, shallow depth of field, dramatic color grading, 2.39:1 framing sensibility.'
        },
        {
            value: 'analog_film',
            label: 'Аналоговая плёнка',
            spec: 'STYLE: Analog film photography. Subtle grain, slightly lifted blacks, warm color shift, organic imperfections. Kodak Portra 400 aesthetic.'
        },
        {
            value: 'surreal',
            label: 'Сюрреализм',
            spec: 'STYLE: Surrealist art. Dreamlike impossible scenes, unexpected juxtapositions, warped perspective, vivid saturated colors.'
        },
        {
            value: 'editorial',
            label: 'Эдиториал',
            spec: 'STYLE: High fashion editorial. Carefully composed, striking, bold. Magazine-quality with intentional art direction and statement lighting.'
        },
        {
            value: 'moody_dark',
            label: 'Мрачный / Dark',
            spec: 'STYLE: Dark moody atmosphere. Low-key lighting, deep shadows, desaturated palette with selective color pops. Noir-influenced.'
        },
        {
            value: 'dreamy_soft',
            label: 'Мечтательный / Soft',
            spec: 'STYLE: Dreamy and ethereal. Soft focus, pastel colors, gentle light bloom, airy atmosphere. Romantic and delicate.'
        },
        {
            value: 'hyperdetail',
            label: 'Гипер-детализация',
            spec: 'STYLE: Hyper-detailed macro/close-up quality. Extreme sharpness, visible micro-textures, pores, fibers. Every detail in razor focus.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: QUALITY & FORMAT
// ═══════════════════════════════════════════════════════════════

export const RANDOM_IMAGE_SIZE = {
    id: 'imageSize',
    label: '📐 Качество',
    description: 'Разрешение изображения',
    options: [
        { value: '1k', label: '1K (Draft) — Быстро' },
        { value: '2k', label: '2K (Standard)' },
        { value: '4k', label: '4K (Maximum) — Медленно' }
    ]
};

export const RANDOM_ASPECT_RATIO = {
    id: 'aspectRatio',
    label: '📏 Формат',
    description: 'Соотношение сторон',
    options: [
        { value: '1:1', label: 'Квадрат 1:1' },
        { value: '3:4', label: 'Вертикаль 3:4' },
        { value: '4:3', label: 'Горизонталь 4:3' },
        { value: '9:16', label: 'Stories 9:16' },
        { value: '16:9', label: 'Кино 16:9' }
    ]
};
