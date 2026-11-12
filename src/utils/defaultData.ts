import { WheelConfig, WheelSlice } from '../types/presentation.ts';
import {
  VIBRANT_STAGE_PALETTE,
  CHAMPIONSHIP_PALETTE,
  getSliceTextColor,
  getBalancedSliceColor,
} from './palette.ts';

export {
  VIBRANT_STAGE_PALETTE,
  CHAMPIONSHIP_PALETTE,
  getSliceTextColor,
  getBalancedSliceColor,
};

export const MAX_SLICES = 150;

// Harmonious palette mapped to VIBRANT_STAGE_PALETTE for 100% uniform dark text
export const PASTEL_PALETTE = VIBRANT_STAGE_PALETTE;

export const getRandomColor = (index?: number, total?: number): string => {
  if (typeof index === 'number') {
    return getBalancedSliceColor(index, total ?? VIBRANT_STAGE_PALETTE.length, VIBRANT_STAGE_PALETTE);
  }
  return VIBRANT_STAGE_PALETTE[Math.floor(Math.random() * VIBRANT_STAGE_PALETTE.length)];
};

export const combineUniqueWords = (base: string[], tiebreak: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  [...base, ...tiebreak].forEach((w) => {
    const clean = w.trim().toUpperCase();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
    }
  });
  return result;
};

export interface WordWithCronica {
  word: string;
  cronica: string;
}

export const createSlicesFromWords = (
  words: string[],
  palette: string[] = VIBRANT_STAGE_PALETTE
): WheelSlice[] => {
  const limited = words.slice(0, MAX_SLICES);
  return limited.map((word, index) => ({
    id: `slice-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    text: word.trim().toUpperCase(),
    color: getBalancedSliceColor(index, limited.length, palette),
  }));
};

export const createSlicesFromCronicas = (
  items: WordWithCronica[],
  palette: string[] = VIBRANT_STAGE_PALETTE
): WheelSlice[] => {
  const limited = items.slice(0, MAX_SLICES);
  return limited.map((item, index) => ({
    id: `slice-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    text: item.word.trim().toUpperCase(),
    cronica: item.cronica.trim().toUpperCase(),
    color: getBalancedSliceColor(index, limited.length, palette),
  }));
};

// ============================================================================
// OFFICIAL SALTO ÁNGEL SPELLING BEE 2026 VOCABULARY DATASETS
// ============================================================================

// Main Vocabulary Lists (1st Place Wheels - 40s Timer)
const WORDS_MAIN_1ST_3RD = [
  'ANIMAL', 'WINDOW', 'PENCIL', 'ORANGE', 'YELLOW', 'FATHER', 'MOTHER',
  'SISTER', 'BROTHER', 'SUMMER', 'WINTER', 'FLOWER', 'DOCTOR', 'MARKET',
  'STREET', 'GARDEN', 'SUNDAY', 'MONDAY', 'DINNER', 'MORNING',
];

const WORDS_MAIN_4TH_6TH = [
  'AFTERNOON', 'BREAKFAST', 'BEAUTIFUL', 'COMPUTER', 'HOSPITAL', 'MOUNTAIN',
  'SANDWICH', 'ELEPHANT', 'DINOSAUR', 'UMBRELLA', 'VACATION', 'LANGUAGE',
  'MAGAZINE', 'QUESTION', 'NEIGHBOR', 'MEDICINE', 'TOMORROW', 'YESTERDAY',
  'REMEMBER', 'SURPRISE', 'TELEPHONE', 'FURNITURE', 'IMPORTANT', 'CHOCOLATE',
  'DIRECTION', 'VEGETABLE', 'DELICIOUS', 'RESTAURANT', 'STRAWBERRY', 'UNIVERSITY',
];

const WORDS_MAIN_HIGHSCHOOL = [
  'FORBID', 'BROADCAST', 'FORESEE', 'MISLEAD', 'MISTAKE', 'MISUNDERSTAND',
  'OVERCOME', 'OVERDO', 'OVEREAT', 'OVERHEAR', 'OVERSLEEP', 'OVERTHROW',
  'PROOFREAD', 'REBUILD', 'REMAKE', 'RESELL', 'RETHINK', 'REWIND',
  'REWRITE', 'SHRINK', 'SPREAD', 'SPRING', 'STRIDE', 'STRING',
  'STRIVE', 'THRIVE', 'UNDERGO', 'UNDERSTAND', 'UNDERTAKE', 'WITHDRAW',
  'WITHHOLD', 'WITHSTAND', 'UPHOLD', 'OVERPAY', 'MISSPELL', 'PARTAKE',
  'OUTGROW', 'OUTSELL', 'OUTSHINE', 'SUNBURN',
];

// Tie-Breaker Vocabulary Lists (2nd/3rd Place Wheels - 20s Timer)
const WORDS_TB_1ST = [
  'STAR', 'MOON', 'SUN', 'TREE', 'FLOWER', 'MOUSE', 'CAT', 'BOY', 'GIRL',
  'BOOK', 'MICE', 'EYES', 'MOTHER', 'FATHER', 'BROTHER', 'SISTER', 'SON',
  'DAUGHTER', 'AUNT', 'UNCLE', 'PET', 'GRANDFATHER', 'GRANDMOTHER',
];

const WORDS_TB_2ND = [
  'WRITE', 'SING', 'CLAP', 'DRAW', 'PICTURE', 'EAT', 'BREAKFAST', 'SHOWER',
  'TAKE', 'DAY', 'MOTHER', 'FATHER', 'GRADUATION', 'BIRTHDAY', 'CHRISTMAS',
  'GIFTS', 'MONTHS', 'DATE',
];

const WORDS_TB_3RD = [
  'YOUR', 'ITS', 'OUR', 'THEIR', 'MINE', 'THOSE', 'THESE', 'WHOSE', 'DUST',
  'FLOOR', 'MOP', 'SWEEP', 'WASH', 'DISHES', 'VACUUM', 'IRON', 'MAKE',
  'BEDS', 'CLOTHES', 'DUSTER', 'BROOM', 'WEEKLY',
];

const WORDS_TB_4TH = [
  'GOOD', 'MORNING', 'AFTERNOON', 'EVENING', 'LATER', 'NIGHT', 'NICE',
  'MEET', 'FIRST', 'SECOND', 'NAME', 'WINDOW', 'BACKPACK', 'PAPER',
  'SHEET', 'PENCIL', 'TEACHER', 'CALENDAR', 'BOOK', 'T-SHIRT', 'DESK',
  'EARTH', 'GLOBE',
];

const WORDS_TB_5TH = [
  'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'NAME', 'DAY', 'AGE',
  'BIRTHDAY', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const WORDS_TB_6TH = [
  'ORDINARY', 'HUNDRED', 'THOUSAND', 'MILLION', 'PREPOSITION',
  'IDENTIFICATION', 'BIOGRAPHY', 'COLOR WHEEL', 'LEISURE', 'INTERESTS',
  'CHESS', 'HOUSEWORK', 'IRONING', 'ROUTINE', 'FREE TIME', 'FRACTION',
  'DECIMAL', 'PERCENTAGE',
];

// Deduplicated High School Tie-Breaker list (removes duplicate 'drive' and 'choose')
const WORDS_TB_HIGHSCHOOL = [
  'BECOME', 'BEGIN', 'BREAK', 'BRING', 'BUILD', 'CATCH', 'CHOOSE',
  'DREAM', 'DRINK', 'DRIVE', 'FORGET', 'FORGIVE', 'FREEZE', 'HOLD',
  'LEARN', 'LEAVE', 'LEND', 'LYING', 'MAN', 'OVERTAKE', 'PAY',
  'READ', 'RING', 'SHAKE', 'SHINE', 'SHOOT', 'SLEEP', 'SPEAK',
  'SPEND', 'WRITE', 'STRIKE', 'SWEAR', 'RUN',
];

// Spanish Elementary Vocabulary (1° a 6° Grado - Concurso de Deletreo con Crónicas)
export const WORDS_SPANISH_CRONICAS: WordWithCronica[] = [
  { cronica: 'CRÓNICA #1', word: 'MARACAIBO' },
  { cronica: 'CRÓNICA #1', word: 'KILÓMETROS' },
  { cronica: 'CRÓNICA #1', word: 'HATICOS' },
  { cronica: 'CRÓNICA #1', word: 'EXTENSIÓN' },
  { cronica: 'CRÓNICA #2', word: 'CAPITÁN' },
  { cronica: 'CRÓNICA #2', word: 'RÚSTICA' },
  { cronica: 'CRÓNICA #2', word: 'APARICIÓN' },
  { cronica: 'CRÓNICA #2', word: 'BASÍLICA' },
  { cronica: 'CRÓNICA #2', word: 'CHIQUINQUIRÁ' },
  { cronica: 'CRÓNICA #3', word: 'CACERÍA' },
  { cronica: 'CRÓNICA #3', word: 'PERDICES' },
  { cronica: 'CRÓNICA #3', word: 'YAGUASAS' },
  { cronica: 'CRÓNICA #3', word: 'BÁQUIROS' },
  { cronica: 'CRÓNICA #3', word: 'PALOMITAS' },
  { cronica: 'CRÓNICA #4', word: 'MARACAIBEROS' },
  { cronica: 'CRÓNICA #5', word: 'PARROQUIAS' },
  { cronica: 'CRÓNICA #6', word: 'TABLITA' },
  { cronica: 'CRÓNICA #7', word: 'PROMOCIÓN' },
  { cronica: 'CRÓNICA #7', word: 'ESPECTÁCULOS' },
  { cronica: 'CRÓNICA #8', word: 'ELÉCTRICO' },
  { cronica: 'CRÓNICA #8', word: 'KEROSENE' },
  { cronica: 'CRÓNICA #8', word: 'INAUGURÓ' },
  { cronica: 'CRÓNICA #9', word: 'CONSTRUIDA' },
  { cronica: 'CRÓNICA #9', word: 'MATRIZ' },
  { cronica: 'CRÓNICA #10', word: 'PATRONAZGO' },
  { cronica: 'CRÓNICA #10', word: 'INTERCESOR' },
  { cronica: 'CRÓNICA #10', word: 'HISTÓRICAMENTE' },
  { cronica: 'CRÓNICA #10', word: 'ALCALDÍA' },
  { cronica: 'CRÓNICA #10', word: 'HISTORIADORES' },
  { cronica: 'CRÓNICA #11', word: 'EMBLEMÁTICO' },
  { cronica: 'CRÓNICA #11', word: 'MEDIODÍA' },
  { cronica: 'CRÓNICA #11', word: 'ARRAIGADA' },
  { cronica: 'CRÓNICA #11', word: 'CARÁCTER' },
  { cronica: 'CRÓNICA #11', word: 'AUTÓCTONO' },
  { cronica: 'CRÓNICA #12', word: 'URDANETA' },
  { cronica: 'CRÓNICA #12', word: 'HÉROE' },
  { cronica: 'CRÓNICA #12', word: 'VENEZUELA' },
  { cronica: 'CRÓNICA #12', word: 'ESTÉTICOS' },
  { cronica: 'CRÓNICA #12', word: 'HOMBRILLO' },
  { cronica: 'CRÓNICA #13', word: 'TURÍSTICO' },
  { cronica: 'CRÓNICA #13', word: 'MECIÉNDOSE' },
  { cronica: 'CRÓNICA #14', word: 'BUHONEROS' },
  { cronica: 'CRÓNICA #14', word: 'MOLINA' },
  { cronica: 'CRÓNICA #15', word: 'AMBROSIO' },
  { cronica: 'CRÓNICA #16', word: 'NEOGÓTICO' },
  { cronica: 'CRÓNICA #17', word: 'OBISPO' },
  { cronica: 'CRÓNICA #18', word: 'ARQUITECTÓNICO' },
  { cronica: 'CRÓNICA #19', word: 'ZAGALETÓN' },
  { cronica: 'CRÓNICA #20', word: 'OVARIOTOMÍA' },
  { cronica: 'CRÓNICA #20', word: 'CIRUGÍA' },
  { cronica: 'CRÓNICA #21', word: 'EMPEDRAO' },
  { cronica: 'CRÓNICA #21', word: 'PARROQUIANOS' },
  { cronica: 'CRÓNICA #22', word: 'CONTEMPORÁNEO' },
  { cronica: 'CRÓNICA #22', word: 'ZULIA' },
  { cronica: 'CRÓNICA #22', word: 'INAUGURACIÓN' },
  { cronica: 'CRÓNICA #23', word: 'CACIQUE' },
  { cronica: 'CRÓNICA #23', word: 'INDÍGENAS' },
  { cronica: 'CRÓNICA #23', word: 'ZAPARAS' },
  { cronica: 'CRÓNICA #23', word: 'MÉRIDA' },
  { cronica: 'CRÓNICA #24', word: 'LECTOESCRITURA' },
  { cronica: 'CRÓNICA #25', word: 'DÉCADAS' },
  { cronica: 'CRÓNICA #26', word: 'ARQUITECTURA' },
  { cronica: 'CRÓNICA #26', word: 'MEZCLAN' },
  { cronica: 'CRÓNICA #26', word: 'BERMÚDEZ' },
  { cronica: 'CRÓNICA #27', word: 'VAGÓN' },
  { cronica: 'CRÓNICA #27', word: 'FERROCARRIL' },
  { cronica: 'CRÓNICA #27', word: 'ESPECÍFICAMENTE' },
  { cronica: 'CRÓNICA #27', word: 'KILÓMETRO' },
  { cronica: 'CRÓNICA #27', word: 'PERIJÁ' },
  { cronica: 'CRÓNICA #28', word: 'LÁPIZ' },
  { cronica: 'CRÓNICA #28', word: 'OBELISCO' },
  { cronica: 'CRÓNICA #29', word: 'ÁRBOLES' },
  { cronica: 'CRÓNICA #29', word: 'VEREDA' },
  { cronica: 'CRÓNICA #29', word: 'BOHÍOS' },
  { cronica: 'CRÓNICA #29', word: 'BÉISBOL' },
  { cronica: 'CRÓNICA #29', word: 'FÚTBOL' },
  { cronica: 'CRÓNICA #30', word: 'PARROQUIA' },
  { cronica: 'CRÓNICA #30', word: 'BUSTAMANTE' },
  { cronica: 'CRÓNICA #30', word: 'CONCEBIDOS' },
  { cronica: 'CRÓNICA #30', word: 'PARTICIPACIÓN' },
  { cronica: 'CRÓNICA #30', word: 'REHABILITACIÓN' },
  { cronica: 'CRÓNICA #30', word: 'REHABILITA' },
  { cronica: 'CRÓNICA #30', word: 'PAISAJISMO' },
  { cronica: 'CRÓNICA #30', word: 'ILUMINACIÓN' },
];

export const WORDS_SPANISH_ELEMENTARY = WORDS_SPANISH_CRONICAS.map((item) => item.word);

export const SPANISH_ELEMENTARY_WHEEL: WheelConfig = {
  id: 'wheel-spanish-elem-1-6',
  name: 'Primaria (1° a 6° Grado)',
  role: 'general',
  group: 'elementary',
  grade: '1st - 6th',
  place: 'general',
  language: 'es',
  spinDuration: 6,
  timerDuration: 30,
  slices: createSlicesFromCronicas(WORDS_SPANISH_CRONICAS),
};

// ============================================================================
// OFFICIAL 11 WHEELS CONFIGURATION (SALTO ÁNGEL 2026 - SPANISH + ENGLISH)
// ============================================================================
export const INITIAL_WHEELS: WheelConfig[] = [
  // --------------------------------------------------------------------------
  // Spanish Contest: Elementary (1° a 6° Grado) - DEFAULT
  // --------------------------------------------------------------------------
  SPANISH_ELEMENTARY_WHEEL,

  // --------------------------------------------------------------------------
  // Group 1: Elementary (1st to 3rd Grade) - English
  // --------------------------------------------------------------------------
  {
    id: 'wheel-elem-1-3-general',
    name: '1st-3rd Grade - General',
    role: 'general',
    group: 'elementary',
    grade: '1st - 3rd',
    place: 'general',
    language: 'en',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(WORDS_MAIN_1ST_3RD),
  },
  {
    id: 'wheel-elem-1st-tb',
    name: '1st Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '1st',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_1ST_3RD, WORDS_TB_1ST)),
  },
  {
    id: 'wheel-elem-2nd-tb',
    name: '2nd Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '2nd',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_1ST_3RD, WORDS_TB_2ND)),
  },
  {
    id: 'wheel-elem-3rd-tb',
    name: '3rd Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '3rd',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_1ST_3RD, WORDS_TB_3RD)),
  },

  // --------------------------------------------------------------------------
  // Group 2: Elementary (4th to 6th Grade)
  // --------------------------------------------------------------------------
  {
    id: 'wheel-elem-4-6-general',
    name: '4th-6th Grade - General',
    role: 'general',
    group: 'elementary',
    grade: '4th - 6th',
    place: 'general',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(WORDS_MAIN_4TH_6TH),
  },
  {
    id: 'wheel-elem-4th-tb',
    name: '4th Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '4th',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_4TH_6TH, WORDS_TB_4TH)),
  },
  {
    id: 'wheel-elem-5th-tb',
    name: '5th Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '5th',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_4TH_6TH, WORDS_TB_5TH)),
  },
  {
    id: 'wheel-elem-6th-tb',
    name: '6th Grade - Tiebreak',
    role: 'tiebreak',
    group: 'elementary',
    grade: '6th',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 30,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_4TH_6TH, WORDS_TB_6TH)),
  },

  // --------------------------------------------------------------------------
  // Group 3: High School (Bachillerato - 1er a 5to Año)
  // --------------------------------------------------------------------------
  {
    id: 'wheel-hs-general',
    name: 'High School - General',
    role: 'general',
    group: 'high_school',
    grade: 'High School',
    place: 'general',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_HIGHSCHOOL),
  },
  {
    id: 'wheel-hs-tb',
    name: 'High School - Tiebreak',
    role: 'tiebreak',
    group: 'high_school',
    grade: 'High School',
    place: 'tiebreak',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(combineUniqueWords(WORDS_MAIN_HIGHSCHOOL, WORDS_TB_HIGHSCHOOL)),
  },
];
