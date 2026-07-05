import { describe, it, expect } from 'vitest';
import { isWordInDictionary, hasPrefix, solveBoard } from './solver.js';

describe('Boggle Solver', () => {
    const dictionary = ['apple', 'cat', 'cats', 'dog', 'dogs', 'pin', 'pine', 'pineapple', 'queen'];

    describe('isWordInDictionary', () => {
        it('should return true for exact matches in the dictionary', () => {
            expect(isWordInDictionary('cat', dictionary)).toBe(true);
            expect(isWordInDictionary('pineapple', dictionary)).toBe(true);
            expect(isWordInDictionary('DOGS', dictionary)).toBe(true); // Case-insensitive
        });

        it('should return false for words not in the dictionary', () => {
            expect(isWordInDictionary('mouse', dictionary)).toBe(false);
            expect(isWordInDictionary('pineapp', dictionary)).toBe(false);
        });
    });

    describe('hasPrefix', () => {
        it('should return true if prefix starts any word in the dictionary', () => {
            expect(hasPrefix('ca', dictionary)).toBe(true);
            expect(hasPrefix('pine', dictionary)).toBe(true);
            expect(hasPrefix('PIN', dictionary)).toBe(true); // Case-insensitive
            expect(hasPrefix('cat', dictionary)).toBe(true); // Direct match is also a valid prefix
        });

        it('should return false if prefix does not start any word in the dictionary', () => {
            expect(hasPrefix('mo', dictionary)).toBe(false);
            expect(hasPrefix('xyz', dictionary)).toBe(false);
        });
    });

    describe('solveBoard', () => {
        it('should solve a 4x4 board correctly', () => {
            // A simple 4x4 matrix
            // C A T S
            // X X X X
            // D O G S
            // P I N E
            const boardMatrix = [
                ['C', 'A', 'T', 'S'],
                ['X', 'X', 'X', 'X'],
                ['D', 'O', 'G', 'S'],
                ['P', 'I', 'N', 'E']
            ];

            // Words that should be found:
            // cat, cats, dog, dogs, pin, pine
            // 'apple' is not on the board.
            const result = solveBoard(boardMatrix, dictionary);
            expect(result).toContain('cat');
            expect(result).toContain('cats');
            expect(result).toContain('dog');
            expect(result).toContain('dogs');
            expect(result).toContain('pin');
            expect(result).toContain('pine');
            expect(result).not.toContain('apple');
        });

        it('should solve a 5x5 board (minimum word length 4)', () => {
            // A simple 5x5 matrix
            // P I N E X
            // X X X X X
            // D O G S X
            // X X X X X
            // X X X X X
            const boardMatrix = [
                ['P', 'I', 'N', 'E', 'X'],
                ['X', 'X', 'X', 'X', 'X'],
                ['D', 'O', 'G', 'S', 'X'],
                ['X', 'X', 'X', 'X', 'X'],
                ['X', 'X', 'X', 'X', 'X']
            ];

            // For 5x5, minimum word length is 4.
            // 'pin' is 3 letters, so it should NOT be found.
            // 'pine' is 4 letters, so it should be found.
            // 'dogs' is 4 letters, so it should be found.
            const result = solveBoard(boardMatrix, dictionary);
            expect(result).toContain('pine');
            expect(result).toContain('dogs');
            expect(result).not.toContain('pin');
        });

        it('should respect custom minimum word lengths', () => {
            const boardMatrix = [
                ['C', 'A', 'T', 'S'],
                ['X', 'X', 'X', 'X'],
                ['D', 'O', 'G', 'S'],
                ['P', 'I', 'N', 'E']
            ];

            const resultMin5 = solveBoard(boardMatrix, dictionary, 5);
            expect(resultMin5.length).toBe(0);

            const resultMin4 = solveBoard(boardMatrix, dictionary, 4);
            expect(resultMin4).toContain('cats');
            expect(resultMin4).toContain('dogs');
            expect(resultMin4).toContain('pine');
            expect(resultMin4).not.toContain('cat');
            expect(resultMin4).not.toContain('dog');
            expect(resultMin4).not.toContain('pin');
        });
    });
});
