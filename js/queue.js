export class Queue {
    constructor() {
        this.count = 0;
        this.lowestCount = 0;
        this.items = {};
    }

    enqueue(element) {
        this.items[this.count] = element;
        this.count++;
    }

    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        const result = this.items[this.lowestCount];
        delete this.items[this.lowestCount];
        this.lowestCount++;
        return result;
    }

    isEmpty() {
        return this.size() === 0;
    }

    clear() {
        this.items = {};
        this.count = 0;
        this.lowestCount = 0;
    }

    size() {
        return this.count - this.lowestCount;
    }
}