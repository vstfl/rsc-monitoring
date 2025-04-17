export function setState(key, value) {
  console.log(`Setting state for key: ${key}`, value);
  if (state[key] === value) {
    console.log(`State unchanged for key: ${key}, skipping update`);
    return;
  }
  state[key] = value;
  const subscribers = subscribersMap.get(key) || new Set();
  console.log(`Notifying ${subscribers.size} subscribers for key: ${key}`);
  subscribers.forEach((callback) => {
    try {
      callback(value);
    } catch (error) {
      console.error(`Error in subscriber for key ${key}:`, error);
    }
  });
}
