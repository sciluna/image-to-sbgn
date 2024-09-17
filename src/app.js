import { port, app } from './index.js';

app.listen(port, () => {
	console.log("Listening on " + port);
});