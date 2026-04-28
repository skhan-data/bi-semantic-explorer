
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function testExtraction(url: string) {
  console.log(`[Test] Fetching: ${url}`);
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    console.log(`[Test] Received ${html.length} bytes`);

    const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      console.log(`[Test] Found CSS: ${match[1]}`);
      try {
        const fullUrl = new URL(match[1], url).href;
        console.log(`[Test] Resolved: ${fullUrl}`);
      } catch (e) {
        console.log(`[Test] Resolve failed for: ${match[1]}`);
      }
    }

    const hexRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
    const colors: string[] = [];
    while ((match = hexRegex.exec(html)) !== null) {
      colors.push(match[0]);
    }
    console.log(`[Test] Found ${colors.length} hex colors`);
  } catch (err: any) {
    console.error(`[Test] Error: ${err.message}`);
  }
}

testExtraction("https://www.google.com");
