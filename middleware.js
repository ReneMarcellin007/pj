export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const url = new URL(request.url);

  // Parse lang cookie
  const cookies = request.headers.get('cookie') || '';
  const langMatch = cookies.match(/(?:^|;\s*)lang=(\w+)/);
  const lang = langMatch ? langMatch[1] : null;

  // Cookie explicit choice takes priority
  if (lang === 'fr') {
    return Response.redirect(new URL('/fr', url.origin), 302);
  }
  if (lang === 'en') {
    return; // serve English (default)
  }

  // Auto-detect from Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  if (/^fr/i.test(acceptLang)) {
    return Response.redirect(new URL('/fr', url.origin), 302);
  }

  // Default: serve English
}
