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
  if (lang === 'en') {
    return Response.redirect(new URL('/en', url.origin), 302);
  }
  if (lang === 'fr') {
    return; // serve French (default)
  }

  // Auto-detect from Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  if (!/^fr/i.test(acceptLang)) {
    return Response.redirect(new URL('/en', url.origin), 302);
  }

  // Default: serve French
}
