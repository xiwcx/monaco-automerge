import { createRootRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <Link to="/">
          <h1 className="page-title">Automerge Monaco</h1>
        </Link>
      </header>

      <Outlet />
    </>
  ),
});
