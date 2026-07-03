export const roleRoutes: Record<string, string[]> = {
  Client: ["/dashboard", "/orders", "/booking", "/chat", "/account"],
  Master: ["/dashboard", "/orders", "/chat", "/master", "/admin/notifications", "/account", "/users"],
  Owner: ["/dashboard", "/orders", "/chat", "/admin", "/reports", "/settings", "/account", "/users"],
};
