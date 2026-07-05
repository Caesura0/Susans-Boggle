import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../js/board.js';

describe('Board', () => {
    let board;

    beforeEach(() => {
        board = new Board(4, 4);
    });

    it('should initialize correctly', () => {
        expect(board.width).toBe(4);
        expect(board.height).toBe(4);
        expect(board.canvasMatrix.length).toBe(0);
    });

    it('should initialize canvas with values', () => {
        const values = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        board.initilizeCanvas([...values]);

        expect(board.canvasMatrix.length).toBe(4);
        expect(board.canvasMatrix[0]).toEqual(['A', 'B', 'C', 'D']);
        expect(board.canvasMatrix[1]).toEqual(['E', 'F', 'G', 'H']);
        expect(board.canvasMatrix[2]).toEqual(['I', 'J', 'K', 'L']);
        expect(board.canvasMatrix[3]).toEqual(['M', 'N', 'O', 'P']);
    });

    it('should find words on the board', () => {
        const values = ['C', 'A', 'T', 'D', 'O', 'G', 'E', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        board.initilizeCanvas([...values]);

        // CAT is laid out as C(0,0), A(0,1), T(0,2)
        expect(board.find('cat')).toBe(true);
        expect(board.find('ca')).toBe(true);
    });

    it('should not find words not on the board', () => {
        const values = ['C', 'A', 'T', 'D', 'O', 'G', 'E', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        board.initilizeCanvas([...values]);

        // XYZ is not on the board
        expect(board.find('xyz')).toBe(false);
    });

    it('should handle case-insensitive search', () => {
        const values = ['C', 'A', 'T', 'D', 'O', 'G', 'E', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        board.initilizeCanvas([...values]);

        expect(board.find('CAT')).toBe(true);
        expect(board.find('Cat')).toBe(true);
        expect(board.find('cAt')).toBe(true);
    });

    it('should find adjacent letters', () => {
        const values = ['D', 'O', 'X', 'X', 'O', 'G', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
        board.initilizeCanvas([...values]);

        // DOG: D(0,0), O(0,1 or 1,0), G(1,1)
        expect(board.find('dog')).toBe(true);
    });

    it('should find words containing multi-character tiles like Qu', () => {
        const values = ['Qu', 'E', 'E', 'N', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
        board.initilizeCanvas([...values]);

        expect(board.find('queen')).toBe(true);
        expect(board.find('que')).toBe(true);
        expect(board.find('qu')).toBe(true);
        expect(board.find('q')).toBe(false); // input too short to match Qu tile
    });
});
