// import { DocHandle, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { createFileRoute } from "@tanstack/react-router";
import { repo } from "../../utils/repo";
import { AutomergeMonacoBinder } from "../../components/AutomergeMonacoBinder";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { MyDoc } from "../../utils/shared-data";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";

export const Route = createFileRoute("/doc/$docId")({
  beforeLoad: ({ params: { docId } }) => {
    const docUrl = `automerge:${docId}`;

    if (!isValidAutomergeUrl(docUrl)) {
      throw new Error("Invalid docUrl");
    }

    return { docUrl };
  },
  loader: ({ context: { docUrl } }) => {
    return {
      repo,
      handle: repo.find<MyDoc>(docUrl),
    };
  },
  component: DocComponent,
});

function DocComponent() {
  const { repo, handle } = Route.useLoaderData();

  console.log("hi");

  return (
    <RepoContext.Provider value={repo}>
      <AutomergeMonacoBinder docUrl={handle.url} />
    </RepoContext.Provider>
  );
}
