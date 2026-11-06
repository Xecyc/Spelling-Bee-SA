import { WheelConfig, WheelSlice } from '../types/presentation.ts';

export const MAX_SLICES = 50;

// Harmonious palette inspired by the screenshot pastel/vibrant colors
export const PASTEL_PALETTE = [
  '#FBBF24', // Sunny yellow
  '#F472B6', // Warm rose/pink
  '#60A5FA', // Sky blue
  '#4ADE80', // Mint green
  '#A78BFA', // Soft purple
  '#FB923C', // Tangerine orange
  '#38BDF8', // Light cerulean
  '#F87171', // Coral red
  '#C084FC', // Violet
  '#34D399', // Emerald pastel
  '#FDE047', // Lemon yellow
  '#E879F9', // Orchid
  '#2DD4BF', // Teal
  '#F97316', // Bright amber
  '#818CF8', // Periwinkle
];

export const getRandomColor = (index?: number): string => {
  if (typeof index === 'number') {
    return PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  }
  return PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
};

export const createSlicesFromWords = (words: string[]): WheelSlice[] => {
  const limited = words.slice(0, MAX_SLICES);
  return limited.map((word, index) => ({
    id: `slice-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    text: word.trim().toUpperCase(),
    color: getRandomColor(index),
  }));
};

const WORDS_1ST_GRADE_1 = [
  'DOCTOR', 'GRANDFATHER', 'FLOWER', 'SUNDAY', 'ANIMAL', 'WINTER', 'SON',
  'PENCIL', 'YELLOW', 'FATHER', 'MOTHER', 'EYES', 'TREE', 'MARKET',
  'UNCLE', 'MICE', 'WINDOW', 'AUNT', 'ORANGE', 'SISTER', 'BOOK',
  'MOON', 'STREET', 'GARDEN', 'DINNER', 'MORNING', 'MONDAY', 'BOY',
  'GIRL', 'CAT', 'PET', 'SUMMER'
];

const WORDS_1ST_GRADE_2 = [
  'WATER', 'SCHOOL', 'FRIEND', 'HAPPY', 'PURPLE', 'RIVER', 'BIRD',
  'HOUSE', 'APPLE', 'CHAIR', 'TABLE', 'BREAD', 'MUSIC', 'LIGHT',
  'NIGHT', 'HORSE', 'TRAIN', 'GREEN', 'WHITE', 'BLACK', 'CLOCK',
  'SMILE', 'GRASS', 'PAPER', 'CANDY', 'PLANT', 'DANCE', 'SLEEP'
];

const WORDS_2ND_GRADE_1 = [
  'BEAUTIFUL', 'MOUNTAIN', 'CHILDREN', 'JOURNEY', 'DOLPHIN', 'TREASURE',
  'WHISPER', 'RAINBOW', 'BUTTERFLY', 'ADVENTURE', 'BLANKET', 'CHAMPION',
  'FEATHER', 'GIRAFFE', 'HOLIDAY', 'ISLAND', 'KANGAROO', 'LANTERN',
  'MYSTERY', 'OCTOPUS', 'PIRATE', 'QUIET', 'RESCUE', 'SHADOW',
  'THUNDER', 'UNICORN', 'VALLEY', 'WIZARD', 'CRYSTAL', 'GARDEN'
];

const WORDS_2ND_GRADE_2 = [
  'MONSTER', 'DIAMOND', 'PENGUIN', 'CASTLE', 'FOREST', 'VOLCANO',
  'BLOSSOM', 'SUNSHINE', 'FEATHER', 'GUITAR', 'PUMPKIN', 'BLANKET',
  'SAILOR', 'SILVER', 'GOLDEN', 'CAPTAIN', 'DRAGON', 'PIRATE',
  'CANDLE', 'WONDER', 'MEADOW', 'BRIDGE', 'STREAM', 'ISLAND'
];

const WORDS_3RD_GRADE_1 = [
  'ASTRONAUT', 'BRILLIANT', 'CELEBRATION', 'DISCOVERY', 'EXPLORATION',
  'FANTASTIC', 'GOVERNMENT', 'HURRICANE', 'IMAGINATION', 'KNOWLEDGE',
  'LABORATORY', 'MAGNIFICENT', 'NAVIGATOR', 'ORCHESTRA', 'PARACHUTE',
  'QUESTION', 'RESTAURANT', 'SCIENTIST', 'TELESCOPE', 'UNIVERSE',
  'VOLCANO', 'WILDERNESS', 'SYMPHONY', 'PHENOMENON', 'KALEIDOSCOPE',
  'EXCELLENT', 'TRIUMPH', 'CHALLENGE'
];

const WORDS_3RD_GRADE_2 = [
  'ADVENTURE', 'BALLOON', 'CARNIVAL', 'DINOSAUR', 'ELECTRIC',
  'FIREWORK', 'GALAXY', 'HARMONY', 'ILLUSION', 'JUNGLE',
  'KINGDOM', 'LEOPARD', 'MAGICIAN', 'NEPTUNE', 'OLYMPIC',
  'PLATINUM', 'PYRAMID', 'RAINBOW', 'SUBMARINE', 'TREASURE',
  'VAMPIRE', 'WARRIOR', 'YESTERDAY', 'ZEBRA'
];

const WORDS_4TH_GRADE_1 = [
  'ACCIDENTAL', 'BOULEVARD', 'CENTURY', 'DIFFICULT', 'ENVIRONMENT',
  'FREQUENCY', 'GENERATION', 'HOSPITALITY', 'INDEPENDENT', 'JUSTICE',
  'KNOWLEDGEABLE', 'LANDSCAPE', 'MICROSCOPE', 'NARRATOR', 'OPPONENT',
  'PERFORMANCE', 'QUALIFIED', 'RECOGNITION', 'SIGNIFICANT', 'TERRITORY'
];

const WORDS_4TH_GRADE_2 = [
  'ABSOLUTE', 'BOUNDARY', 'COMMUNITY', 'DIVERSITY', 'ELEMENTARY',
  'FRACTION', 'GEOGRAPHY', 'HERITAGE', 'IMPORTANT', 'JUDGMENT',
  'LITERATURE', 'MONUMENT', 'NATIONAL', 'OPERATION', 'POPULATION',
  'QUARTER', 'RELATION', 'STRUCTURE', 'TRADITION', 'UNDERSTAND'
];

const WORDS_5TH_GRADE_1 = [
  'ACCOMMODATE', 'BELLIGERENT', 'CAMOUFLAGE', 'DELINQUENT', 'EMBARRASS',
  'FLUORESCENT', 'GUILLOTINE', 'HIERARCHY', 'INDISPENSABLE', 'KALEIDOSCOPE',
  'LIEUTENANT', 'MISCHIEVOUS', 'NEIGHBORHOOD', 'OCCURRENCE', 'PARLIAMENT',
  'QUESTIONNAIRE', 'RENAISSANCE', 'SURVEILLANCE', 'TYRANNY', 'UNCONSCIOUS'
];

const WORDS_5TH_GRADE_2 = [
  'AUTHENTIC', 'BENEFICIAL', 'CHALLENGING', 'DECISIVE', 'ENTHUSIASM',
  'FOUNDATION', 'GOVERNOR', 'HYPOTHESIS', 'ILLUSTRATION', 'JOURNALIST',
  'LEGISLATURE', 'MAINTENANCE', 'NECESSARY', 'OPPORTUNITY', 'PERSPECTIVE',
  'REVOLUTION', 'SUBSTANTIAL', 'TECHNIQUE', 'UNANIMOUS', 'VULNERABLE'
];

const WORDS_6TH_GRADE_1 = [
  'ANESTHESIA', 'BUREAUCRACY', 'CONVALESCENT', 'DISCIPLINARY', 'ECCENTRIC',
  'FORFEITURE', 'GRIEVANCE', 'HEMORRHAGE', 'IDIOSYNCRASY', 'JURISDICTION',
  'KLEPTOMANIA', 'LABYRINTH', 'MALICIOUS', 'NONCHALANT', 'OBSOLESCENCE',
  'PHILANTHROPY', 'QUINTESSENTIAL', 'REMINISCENCE', 'SACRILEGIOUS', 'TRANSCENDENT'
];

const WORDS_6TH_GRADE_2 = [
  'APPARATUS', 'COLLEAGUE', 'DESPERATE', 'EQUIVALENT', 'FASCINATING',
  'GOVERNMENT', 'HOMOGENEOUS', 'INADVERTENT', 'LEGITIMATE', 'METAPHORICAL',
  'NEGOTIATION', 'ORIGINALLY', 'PHILOSOPHY', 'RESERVOIR', 'SOPHISTICATED',
  'TEMPERAMENT', 'UNPRECEDENTED', 'VETERINARIAN', 'WITHDRAWAL', 'ZOOLOGICAL'
];

const WORDS_HIGHSCHOOL_1 = [
  'ABERRATION', 'BELLWETHER', 'CIRCUMLOCUTION', 'DISINGENUOUS', 'EPHEMERAL',
  'FASTIDIOUS', 'GRANDILOQUENT', 'HEGEMONY', 'INTRANSIGENT', 'JUXTAPOSITION',
  'KLEPTOCRACY', 'LOQUACIOUS', 'MAGNANIMOUS', 'NEPOTISM', 'ONOMATOPOEIA',
  'PANACEA', 'QUERULOUS', 'RECALCITRANT', 'SYCOPHANT', 'UBIQUITOUS',
  'VERISIMILITUDE', 'ZEITGEIST'
];

const WORDS_HIGHSCHOOL_2 = [
  'ANACHRONISM', 'BOURGEOISIE', 'CACOPHONY', 'DELETERIOUS', 'EQUANIMITY',
  'FORTUITOUS', 'GARRULOUS', 'HUBRIS', 'IMPECUNIOUS', 'LACONIC',
  'MEGALOMANIA', 'NADIR', 'OSTENTATIOUS', 'PERFIDIOUS', 'QUINTESSENCE',
  'RESILIENT', 'SANGUINE', 'TACITURN', 'USURPATION', 'VACILLATE',
  'WINDFALL', 'XENOPHOBIA'
];

export const INITIAL_WHEELS: WheelConfig[] = [
  // Elementary - 1st Grade
  {
    id: 'wheel-elem-1st-1',
    name: '1st Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '1st',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_1ST_GRADE_1),
  },
  {
    id: 'wheel-elem-1st-2',
    name: '1st Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '1st',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_1ST_GRADE_2),
  },

  // Elementary - 2nd Grade
  {
    id: 'wheel-elem-2nd-1',
    name: '2nd Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '2nd',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_2ND_GRADE_1),
  },
  {
    id: 'wheel-elem-2nd-2',
    name: '2nd Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '2nd',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_2ND_GRADE_2),
  },

  // Elementary - 3rd Grade
  {
    id: 'wheel-elem-3rd-1',
    name: '3rd Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '3rd',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_3RD_GRADE_1),
  },
  {
    id: 'wheel-elem-3rd-2',
    name: '3rd Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '3rd',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_3RD_GRADE_2),
  },

  // Elementary - 4th Grade
  {
    id: 'wheel-elem-4th-1',
    name: '4th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '4th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_4TH_GRADE_1),
  },
  {
    id: 'wheel-elem-4th-2',
    name: '4th Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '4th',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_4TH_GRADE_2),
  },

  // Elementary - 5th Grade
  {
    id: 'wheel-elem-5th-1',
    name: '5th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '5th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_5TH_GRADE_1),
  },
  {
    id: 'wheel-elem-5th-2',
    name: '5th Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '5th',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_5TH_GRADE_2),
  },

  // Elementary - 6th Grade
  {
    id: 'wheel-elem-6th-1',
    name: '6th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '6th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_6TH_GRADE_1),
  },
  {
    id: 'wheel-elem-6th-2',
    name: '6th Grade - 2nd/3rd Place',
    role: '2nd',
    group: 'elementary',
    grade: '6th',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_6TH_GRADE_2),
  },

  // High School (1st to 5th Year Shared Pool)
  {
    id: 'wheel-hs-1st',
    name: 'High School - 1st Place',
    role: '1st',
    group: 'high_school',
    grade: 'High School',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_HIGHSCHOOL_1),
  },
  {
    id: 'wheel-hs-2nd-3rd',
    name: 'High School - 2nd/3rd Place',
    role: '2nd',
    group: 'high_school',
    grade: 'High School',
    place: '2nd_3rd',
    spinDuration: 6,
    timerDuration: 20,
    slices: createSlicesFromWords(WORDS_HIGHSCHOOL_2),
  },
];
