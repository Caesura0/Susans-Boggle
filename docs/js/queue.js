var queue = function () {
    this.count = 0;
    this.lowestCount = 0;
    this.items = {};
};

queue.prototype.enqueue = function (element) {
    this.items[this.count] = element;
    this.count++;
};

queue.prototype.dequeue = function () {
    if (this.isEmpty()) {
        return undefined;
    }
    const result = this.items[this.lowestCount];
    delete this.items[this.lowestCount];
    this.lowestCount++;
    return result;
};

queue.prototype.isEmpty = function () {
    return this.size() === 0;
};

queue.prototype.clear = function () {
    this.items = {};
    this.count = 0;
    this.lowestCount = 0;
};

queue.prototype.size = function () {
    return this.count - this.lowestCount;
};

console.log('queue loaded');