// import { DocHandle, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { createFileRoute } from "@tanstack/react-router";
import { repo } from "../../utils/repo";
import { AutomergeMonacoBinder } from "./components/AutomergeMonacoBinder";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { MyDoc } from "../../utils/shared-data";

export const Route = createFileRoute("/doc/$docId")({
  beforeLoad: ({ params: { docId } }) => {
    const docUrl = `automerge:${docId}`;

    if (!isValidAutomergeUrl(docUrl)) {
      throw new Error("Invalid docUrl");
    }

    return { docUrl };
  },
  loader: async ({ context: { docUrl } }) => {
    const handle = repo.find<MyDoc>(docUrl);

    try {
      await handle.isReady();
    } catch (error) {
      throw new Error("Doc not found");
    }

    return {
      handle,
    };
  },
  component: DocComponent,
});

function DocComponent() {
  const { handle } = Route.useLoaderData();

  return (
    <main>
      <AutomergeMonacoBinder docUrl={handle.url} />
    </main>
  );
}
