function Timer(delay, count) {
	this.delay = delay;
	this.count = count;
	this.currentCount = 0;
	this.intervalId = null;
	this.startTime = null;
}
Bw.extend(Timer, Bw.EventEmitter);

Timer.EVENT_TIMER = "timer";
Timer.EVENT_TIMER_COMPLETE = "timerComplete";

Timer.prototype.start = function() {
	this.stop();
	this.currentCount = 0;
	var self = this;
	this.startTime = (new Date().getTime());
	this.intervalId = window.setInterval(function() { self._onTimer(); }, this.delay);
}

Timer.prototype.stop = function() {
	if(this.intervalId) {
		window.clearInterval(this.intervalId);
		this.intervalId = null;
	}
}

Timer.prototype.isRunning = function() {
	return !!this.intervalId;
}

Timer.prototype.time = function() {
	return (new Date().getTime()) - this.startTime;
}

Timer.prototype._onTimer = function() {
	++this.currentCount;
	this.emit(Timer.EVENT_TIMER);
	if(typeof this.count !== "undefined" && this.currentCount >= this.count) {
		this.stop();
		this.emit(Timer.EVENT_TIMER_COMPLETE);
	}
}
Object.freeze(Timer.prototype);