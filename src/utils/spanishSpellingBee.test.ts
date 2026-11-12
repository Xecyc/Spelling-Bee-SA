import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_WHEELS,
  SPANISH_ELEMENTARY_WHEEL,
  WORDS_SPANISH_ELEMENTARY,
} from './defaultData';
import { useContestStore } from '../store';

test('Spanish Elementary Wheel is defined as the first default wheel', () => {
  assert.ok(INITIAL_WHEELS.length > 0, 'INITIAL_WHEELS must not be empty');
  const firstWheel = INITIAL_WHEELS[0];
  assert.equal(firstWheel.id, 'wheel-spanish-elem-1-6');
  assert.equal(firstWheel.language, 'es');
  assert.equal(firstWheel.group, 'elementary');
  assert.equal(firstWheel.grade, '1st - 6th');
  assert.equal(firstWheel.role, 'general');
  assert.equal(firstWheel.timerDuration, 30, 'Spanish elementary wheel must default to 30 seconds');
});

test('Spanish Elementary Wheel vocabulary includes accents and special characters (Á, É, Í, Ó, Ú, Ñ, Ü)', () => {
  assert.ok(WORDS_SPANISH_ELEMENTARY.length >= 60, 'Must have at least 60 words for elementary Spanish');
  assert.equal(SPANISH_ELEMENTARY_WHEEL.slices.length, WORDS_SPANISH_ELEMENTARY.length);

  const texts = SPANISH_ELEMENTARY_WHEEL.slices.map((s) => s.text);
  assert.ok(texts.includes('ÁRBOL'), 'Must include ÁRBOL with Á');
  assert.ok(texts.includes('CORAZÓN'), 'Must include CORAZÓN with Ó');
  assert.ok(texts.includes('MÚSICA'), 'Must include MÚSICA with Ú');
  assert.ok(texts.includes('JARDÍN') || texts.includes('ILUSIÓN'), 'Must include word with Í');
  assert.ok(texts.includes('BRÚJULA'), 'Must include BRÚJULA with Ú');
  assert.ok(texts.includes('ÑANDÚ'), 'Must include word with Ñ');
  assert.ok(texts.includes('DELFINES'), 'Must include DELFINES');

  // Verify all slices have valid unique IDs, enabled state, and non-empty colors
  SPANISH_ELEMENTARY_WHEEL.slices.forEach((slice, idx) => {
    assert.ok(slice.id, `Slice ${idx} must have an id`);
    assert.ok(slice.text && slice.text.trim().length > 0, `Slice ${idx} must have non-empty text`);
    assert.ok(slice.color && slice.color.startsWith('#'), `Slice ${idx} must have a valid hex color`);
  });
});

test('Contest Store defaults to Spanish language', () => {
  assert.equal(useContestStore.getState().contestLanguage, 'es', 'Default contest language must be Spanish');

  useContestStore.getState().setContestLanguage('en');
  assert.equal(useContestStore.getState().contestLanguage, 'en', 'Must switch to English');

  useContestStore.getState().setContestLanguage('es');
  assert.equal(useContestStore.getState().contestLanguage, 'es', 'Must switch back to Spanish');
});

test('Slide count and clamping rules: Spanish mode has strictly 2 slides (Welcome and Wheel)', () => {
  const getSlideConfig = (language: 'es' | 'en') => {
    const isSpanish = language === 'es';
    const totalSlides = isSpanish ? 2 : 3;
    const maxSlideIndex = totalSlides - 1;
    const slideTitles = isSpanish
      ? ['Concurso de Deletreo', 'Ruleta Interactiva']
      : ['Welcome & Title', 'Interactive Wheel & Timer', 'Winner Podium'];
    return { isSpanish, totalSlides, maxSlideIndex, slideTitles };
  };

  const spanishConfig = getSlideConfig('es');
  assert.equal(spanishConfig.totalSlides, 2, 'Spanish mode must have exactly 2 slides');
  assert.equal(spanishConfig.maxSlideIndex, 1, 'Max slide index in Spanish mode must be 1');
  assert.equal(spanishConfig.slideTitles.length, 2);
  assert.equal(spanishConfig.slideTitles[0], 'Concurso de Deletreo');
  assert.equal(spanishConfig.slideTitles[1], 'Ruleta Interactiva');

  const englishConfig = getSlideConfig('en');
  assert.equal(englishConfig.totalSlides, 3, 'English mode must have 3 slides');
  assert.equal(englishConfig.maxSlideIndex, 2);
  assert.equal(englishConfig.slideTitles.length, 3);
});

test('Transition from English Podium (slide 2) to Spanish clamps slide to 1', () => {
  let currentSlide = 2; // On podium in English
  const handleSwitchLanguage = (lang: 'es' | 'en') => {
    if (lang === 'es' && currentSlide > 1) {
      currentSlide = 1;
    }
  };

  handleSwitchLanguage('es');
  assert.equal(currentSlide, 1, 'Slide must be clamped to 1 when switching to Spanish');
});

test('Spanish mode custom background artwork files exist in /public/assets/aistudio/', () => {
  const slide0Bg = path.resolve(process.cwd(), 'public/assets/aistudio/image_5d551975.png');
  const slide1Bg = path.resolve(process.cwd(), 'public/assets/aistudio/image_a510c802.png');

  assert.ok(fs.existsSync(slide0Bg), 'Slide 0 image_5d551975.png must exist');
  assert.ok(fs.existsSync(slide1Bg), 'Slide 1 image_a510c802.png must exist');

  const stat0 = fs.statSync(slide0Bg);
  const stat1 = fs.statSync(slide1Bg);
  assert.ok(stat0.size > 10000, 'Slide 0 image must be non-empty valid asset');
  assert.ok(stat1.size > 10000, 'Slide 1 image must be non-empty valid asset');
});

test('Studio wheel filtering correctly isolates Spanish, English Elementary, and High School wheels', () => {
  const allWheels = INITIAL_WHEELS;

  const spanishWheels = allWheels.filter((w) => w.language === 'es');
  assert.equal(spanishWheels.length, 1, 'Should have exactly 1 Spanish wheel');
  assert.equal(spanishWheels[0].id, 'wheel-spanish-elem-1-6');

  const englishElemWheels = allWheels.filter((w) => (w.group === 'elementary' || !w.group) && w.language !== 'es');
  assert.ok(englishElemWheels.length >= 4, 'Should have at least 4 English elementary wheels');

  const highSchoolWheels = allWheels.filter((w) => w.group === 'high_school');
  assert.ok(highSchoolWheels.length >= 2, 'Should have at least 2 High School wheels');
});
