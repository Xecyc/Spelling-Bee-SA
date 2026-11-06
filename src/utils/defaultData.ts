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

// ============================================================================
// OFFICIAL 14 WHEELS CONFIGURATION
// ============================================================================
export const INITIAL_WHEELS: WheelConfig[] = [
  // 1. Elementary - 1st Grade
  {
    id: 'wheel-elem-1st-1',
    name: '1st Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '1st',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_1ST_3RD),
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
    slices: createSlicesFromWords(WORDS_TB_1ST),
  },

  // 2. Elementary - 2nd Grade
  {
    id: 'wheel-elem-2nd-1',
    name: '2nd Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '2nd',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_1ST_3RD),
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
    slices: createSlicesFromWords(WORDS_TB_2ND),
  },

  // 3. Elementary - 3rd Grade
  {
    id: 'wheel-elem-3rd-1',
    name: '3rd Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '3rd',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_1ST_3RD),
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
    slices: createSlicesFromWords(WORDS_TB_3RD),
  },

  // 4. Elementary - 4th Grade
  {
    id: 'wheel-elem-4th-1',
    name: '4th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '4th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_4TH_6TH),
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
    slices: createSlicesFromWords(WORDS_TB_4TH),
  },

  // 5. Elementary - 5th Grade
  {
    id: 'wheel-elem-5th-1',
    name: '5th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '5th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_4TH_6TH),
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
    slices: createSlicesFromWords(WORDS_TB_5TH),
  },

  // 6. Elementary - 6th Grade
  {
    id: 'wheel-elem-6th-1',
    name: '6th Grade - 1st Place',
    role: '1st',
    group: 'elementary',
    grade: '6th',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_4TH_6TH),
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
    slices: createSlicesFromWords(WORDS_TB_6TH),
  },

  // 7. High School (1er a 5to Año)
  {
    id: 'wheel-hs-1st',
    name: 'High School - 1st Place',
    role: '1st',
    group: 'high_school',
    grade: 'High School',
    place: '1st',
    spinDuration: 6,
    timerDuration: 40,
    slices: createSlicesFromWords(WORDS_MAIN_HIGHSCHOOL),
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
    slices: createSlicesFromWords(WORDS_TB_HIGHSCHOOL),
  },
];
