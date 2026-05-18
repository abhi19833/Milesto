import { useState } from "react";

function App() {
  const [count, setcount] = useState(0);
  return (
    <>
      <div>
        {count}
        <button onClick={() => setcount(count + 1)}>click</button>
      </div>
    </>
  );
}
export default App;
