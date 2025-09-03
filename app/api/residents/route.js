import { NextResponse } from 'next/server'
import config from '../../../lib/config'

export async function GET() {
  return NextResponse.json({ 
    message: 'Residents API endpoint',
    server: {
      url: config.baseUrl,
      port: config.port
    },
    residents: [] 
  })
}

export async function POST(request) {
  const body = await request.json()
  return NextResponse.json({ 
    message: 'Resident created',
    server: {
      url: config.baseUrl,
      port: config.port
    },
    resident: body 
  })
}
