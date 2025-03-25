const queues = new Map();
const locks = new Map();

function getQueue(channelId) {
  if (!queues.has(channelId)) {
    queues.set(channelId, []);
  }
  return queues.get(channelId);
}

function addToQueue(channelId, userId, displayName) {
  const queue = getQueue(channelId);
  if (!queue.find((p) => p.userId === userId)) {
    queue.push({ userId, displayName });
    return true;
  }
  return false;
}

function removeFromQueue(channelId, userId) {
  const queue = getQueue(channelId);
  const index = queue.findIndex((p) => p.userId === userId);
  if (index !== -1) {
    queue.splice(index, 1);
    return true;
  }
  return false;
}

function getQueueList(channelId) {
  const queue = getQueue(channelId);
  if (queue.length === 0) return "\nNo one in the queue.";
  return `\n${queue.map((p, i) => `${i + 1}. ${p.displayName}`).join("\n")}`;
}

function withLock(channelId, fn) {
  if (!locks.has(channelId)) {
    locks.set(channelId, Promise.resolve());
  }

  const run = locks.get(channelId).then(() => fn().catch(console.error));
  locks.set(
    channelId,
    run.catch(() => {})
  ); // Maintain lock chain
  return run;
}

module.exports = {
  getQueue,
  addToQueue,
  removeFromQueue,
  getQueueList,
  withLock,
};
