import { handleParseRequest } from '../server/aiParse';

/**
 * Serverless route (Vercel-style, Web Request/Response) for AI parsing.
 * Set ANTHROPIC_API_KEY in the hosting environment and build the frontend with
 * VITE_AI_PARSE_ENDPOINT=/api/parse to enable it.
 */
export async function POST(request: Request): Promise<Response> {
  const result = await handleParseRequest(await request.text(), process.env.ANTHROPIC_API_KEY);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
