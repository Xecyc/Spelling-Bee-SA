import { WheelConfig, WheelSlice } from '../types/presentation';

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

const WORDS_1ST_GRADE = [
  'DOCTOR', 'GRANDFATHER', 'FLOWER', 'SUNDAY', 'ANIMAL', 'WINTER', 'SON',
  'PENCIL', 'YELLOW', 'FATHER', 'MOTHER', 'EYES', 'TREE', 'MARKET',
  'UNCLE', 'MICE', 'WINDOW', 'AUNT', 'ORANGE', 'SISTER', 'BOOK',
  'MOON', 'STREET', 'GARDEN', 'DINNER', 'MORNING', 'MONDAY', 'BOY',
  'GIRL', 'CAT', 'PET', 'SUMMER'
];

const WORDS_2ND_GRADE = [
  'BEAUTIFUL', 'MOUNTAIN', 'CHILDREN', 'JOURNEY', 'DOLPHIN', 'TREASURE',
  'WHISPER', 'RAINBOW', 'BUTTERFLY', 'ADVENTURE', 'BLANKET', 'CHAMPION',
  'FEATHER', 'GIRAFFE', 'HOLIDAY', 'ISLAND', 'KANGAROO', 'LANTERN',
  'MYSTERY', 'OCTOPUS', 'PIRATE', 'QUIET', 'RESCUE', 'SHADOW',
  'THUNDER', 'UNICORN', 'VALLEY', 'WIZARD', 'CRYSTAL', 'GARDEN'
];

const WORDS_3RD_GRADE = [
  'ASTRONAUT', 'BRILLIANT', 'CELEBRATION', 'DISCOVERY', 'EXPLORATION',
  'FANTASTIC', 'GOVERNMENT', 'HURRICANE', 'IMAGINATION', 'KNOWLEDGE',
  'LABORATORY', 'MAGNIFICENT', 'NAVIGATOR', 'ORCHESTRA', 'PARACHUTE',
  'QUESTION', 'RESTAURANT', 'SCIENTIST', 'TELESCOPE', 'UNIVERSE',
  'VOLCANO', 'WILDERNESS', 'SYMPHONY', 'PHENOMENON', 'KALEIDOSCOPE',
  'EXCELLENT', 'TRIUMPH', 'CHALLENGE'
];

export const INITIAL_WHEELS: WheelConfig[] = [
  {
    id: 'wheel-1st-grade',
    name: '1ST GRADE TIE',
    role: '1st',
    spinDuration: 6,
    slices: createSlicesFromWords(WORDS_1ST_GRADE),
  },
  {
    id: 'wheel-2nd-grade',
    name: '2ND GRADE TIE',
    role: '2nd',
    spinDuration: 6,
    slices: createSlicesFromWords(WORDS_2ND_GRADE),
  },
  {
    id: 'wheel-3rd-grade',
    name: '3RD GRADE TIE',
    role: '3rd',
    spinDuration: 6,
    slices: createSlicesFromWords(WORDS_3RD_GRADE),
  },
];
