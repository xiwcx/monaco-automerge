import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { repo } from "../utils/repo";
import { useRouter } from "@tanstack/react-router";
import { D } from "@mobily/ts-belt";
import { DocButton } from "./components/DocButton";

export const Route = createFileRoute("/")({
  loader: () => ({
    repo,
  }),
  component: IndexComponent,
});

function IndexComponent() {
  const { repo } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate({ from: "/doc/$docId" });

  return (
    <main className="main-content">
      <ul className="doc-list">
        {D.keys(repo.handles).map((docId) => (
          <DocButton
            docId={docId}
            key={docId}
            onDelete={() => {
              repo.delete(docId);
              router.invalidate();
            }}
          />
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
