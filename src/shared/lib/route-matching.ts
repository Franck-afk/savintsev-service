export function matchesRoute(pathname: string, route: string): boolean {
  const normalizedRoute = route === "/" ? "/" : route.replace(/\/+$/, "");

  if (normalizedRoute === "/") {
    return pathname === "/";
  }

  return pathname === normalizedRoute || pathname.startsWith(`${normalizedRoute}/`);
}
