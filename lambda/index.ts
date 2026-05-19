import { handle } from 'hono/aws-lambda'
import app from '../src/index'

export const handler = handle(app)
