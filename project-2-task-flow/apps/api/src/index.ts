import { config } from './config';
import app from './app';

app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
});