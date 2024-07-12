import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <Link to="/">
          <h1 className="page-title">Automerge Monaco</h1>
        </Link>
      </header>

      <Outlet />

      <TanStackRouterDevtools />
    </>
  ),
});
