import { Hono } from 'hono'
import { generateQr, type QrParams } from '../services/qr'

export const qrRoutes = new Hono()

qrRoutes.get('/qr', async (c) => {
  const params: QrParams = {
    text: c.req.query('text'),
    style: c.req.query('style'),
    size: c.req.query('size'),
    margin: c.req.query('margin'),
    ec_level: c.req.query('ec_level'),
    return_type: c.req.query('return_type'),
    color: c.req.query('color'),
    color_bg: c.req.query('color_bg'),
    label: c.req.query('label'),
    label_position: c.req.query('label_position'),
    text_size: c.req.query('text_size'),
    padding_size: c.req.query('padding_size'),
    icon_url: c.req.query('icon_url'),
    icon_size: c.req.query('icon_size'),
    icon_margin: c.req.query('icon_margin'),
    icon_hide_bg_dots: c.req.query('icon_hide_bg_dots'),
    dot_type: c.req.query('dot_type'),
    dot_scale: c.req.query('dot_scale'),
    corner_square_type: c.req.query('corner_square_type'),
    corner_square_color: c.req.query('corner_square_color'),
    corner_dot_type: c.req.query('corner_dot_type'),
    corner_dot_color: c.req.query('corner_dot_color'),
    gradient_type: c.req.query('gradient_type'),
    gradient_color1: c.req.query('gradient_color1'),
    gradient_color2: c.req.query('gradient_color2'),
    gradient_rotation: c.req.query('gradient_rotation'),
  }

  const result = await generateQr(params)

  if (result.kind === 'error') {
    return c.json({ error: result.error }, result.status as 400 | 500)
  }

  const contentType = result.kind === 'png' ? 'image/png' : 'image/svg+xml'
  return new Response(result.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
