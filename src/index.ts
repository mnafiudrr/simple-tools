import { Hono } from 'hono'
import { qrRoutes } from './routes/qr'

const app = new Hono()
app.route('/', qrRoutes)

export default app
