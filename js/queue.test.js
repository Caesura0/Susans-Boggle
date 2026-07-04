import { describe, it, expect, beforeEach } from 'vitest';
import { Queue } from '../js/queue.js';

describe('Queue Data Structure', () => {
    let queue;

    beforeEach(() => {
        queue = new Queue();
    });

    it('should start empty', () => {
        expect(queue.isEmpty()).toBe(true);
        expect(queue.size()).toBe(0);
    });

    it('should enqueue and dequeue elements', () => {
        queue.enqueue('a');
        queue.enqueue('b');
        queue.enqueue('c');

        expect(queue.size()).toBe(3);
        expect(queue.isEmpty()).toBe(false);

        expect(queue.dequeue()).toBe('a');
        expect(queue.dequeue()).toBe('b');
        expect(queue.dequeue()).toBe('c');
        expect(queue.isEmpty()).toBe(true);
    });

    it('should return undefined when dequeuing from empty queue', () => {
        expect(queue.dequeue()).toBeUndefined();
    });

    it('should track size correctly after multiple operations', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        expect(queue.size()).toBe(2);

        queue.dequeue();
        expect(queue.size()).toBe(1);

        queue.enqueue(3);
        expect(queue.size()).toBe(2);
    });

    it('should clear the queue', () => {
        queue.enqueue('a');
        queue.enqueue('b');
        queue.clear();

        expect(queue.isEmpty()).toBe(true);
        expect(queue.size()).toBe(0);
    });

    it('should handle large numbers of elements', () => {
        for (let i = 0; i < 1000; i++) {
            queue.enqueue(i);
        }
        expect(queue.size()).toBe(1000);

        for (let i = 0; i < 1000; i++) {
            expect(queue.dequeue()).toBe(i);
        }
        expect(queue.isEmpty()).toBe(true);
    });
});
