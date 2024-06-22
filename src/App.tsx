import { Editor } from "./components/Editor";
import "./App.css";

function App() {
  return (
    <main>
      <Editor divProps={{ className: "editor" }} />
    </main>
  );
}

export default App;
