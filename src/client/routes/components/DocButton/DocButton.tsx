import { type DocumentId } from "@automerge/automerge-repo";
import { Link } from "@tanstack/react-router";
import style from "./doc-button.module.css";

type DocButtonProps = { docId: DocumentId; onDelete: () => void };

export const DocButton = ({ docId, onDelete }: DocButtonProps) => (
  <li className={style.doc} key={docId}>
    <Link to="/doc/$docId" params={{ docId }}>
      <span className={style.title}>{docId}</span>{" "}
      <span className={`button ${style.go}`}>→</span>
    </Link>

    <button className={style.delete} onClick={onDelete}>
      🗑️
    </button>
  </li>
);
