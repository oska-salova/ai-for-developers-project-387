import { createApp } from "./app.js";
import { seedDefaultMeetingType } from "./default-meeting-type.js";
import { createStore } from "./store.js";

const port = Number(process.env.PORT ?? 3001);
const store = createStore();

// The data is in memory, so each start begins with the one default meeting type
// that makes the booking flow walkable end to end.
seedDefaultMeetingType(store);

const app = createApp({ store, now: () => new Date() });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
