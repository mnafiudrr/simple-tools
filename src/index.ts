import { Hono } from 'hono'
import { qrRoutes } from './routes/qr'
import { helpRoutes } from './routes/help';

const app = new Hono()
app.route('/', qrRoutes)
app.route('/', helpRoutes)

export default app
