import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { repo } from "../utils/repo";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => repo.handles,
  component: IndexComponent,
});

function IndexComponent() {
  const handles = Route.useLoaderData();
  const navigate = useNavigate({ from: "/doc/$docId" });

  return (
    <main>
      <ul>
        {Object.keys(handles).map((docId) => (
          <li key={docId}>
            <Link to="/doc/$docId" params={{ docId }}>
              {docId}
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          const handle = repo.create({ text: "" });

          navigate({
            to: "/doc/$docId",
            params: { docId: handle.documentId },
          });
        }}
      >
        Create New Doc
      </button>
    </main>
  );
}
