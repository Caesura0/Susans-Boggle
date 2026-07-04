import { describe, it, expect } from 'vitest';
import { getPointsForWord, getLetterCount } from '../js/game.js';

describe('Game Scoring', () => {
    describe('getLetterCount', () => {
        it('should count regular letters', () => {
            expect(getLetterCount('cat')).toBe(3);
            expect(getLetterCount('hello')).toBe(5);
        });

        it('should count Qu as two letters', () => {
            expect(getLetterCount('queen')).toBe(5); // q + u + e + e + n = 5
            expect(getLetterCount('Qu')).toBe(2);
            expect(getLetterCount('QuEEN')).toBe(5);
        });

        it('should handle empty strings', () => {
            expect(getLetterCount('')).toBe(0);
            expect(getLetterCount(null)).toBe(0);
        });

        it('should handle mixed case with Qu', () => {
            expect(getLetterCount('qUeen')).toBe(5);
            expect(getLetterCount('QUEEN')).toBe(5);
        });
    });

    describe('getPointsForWord', () => {
        it('should award 1 point for 3-4 letter words', () => {
            expect(getPointsForWord('cat', getLetterCount)).toBe(1);
            expect(getPointsForWord('dogs', getLetterCount)).toBe(1);
        });

        it('should award 2 points for 5 letter words', () => {
            expect(getPointsForWord('hello', getLetterCount)).toBe(2);
        });

        it('should award 3 points for 6 letter words', () => {
            expect(getPointsForWord('better', getLetterCount)).toBe(3);
        });

        it('should award 5 points for 7 letter words', () => {
            expect(getPointsForWord('kitchen', getLetterCount)).toBe(5);
        });

        it('should award 11 points for 8+ letter words', () => {
            expect(getPointsForWord('absolute', getLetterCount)).toBe(11);
            expect(getPointsForWord('something', getLetterCount)).toBe(11);
        });

        it('should award points correctly for words with Qu', () => {
            // queen = 5 letters -> 2 points
            expect(getPointsForWord('queen', getLetterCount)).toBe(2);
        });

        it('should award 0 points for words under 3 letters', () => {
            expect(getPointsForWord('ab', getLetterCount)).toBe(0);
            expect(getPointsForWord('a', getLetterCount)).toBe(0);
        });
    });
});
