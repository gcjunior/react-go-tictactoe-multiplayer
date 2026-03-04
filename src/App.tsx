import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [player, setPlayer] = useState("");
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winner, setWinner] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8080/ws");

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Player assignment message
      if (data.type === "player") {
        setPlayer(data.player);
      } else {
        // Game state update
        setBoard(data.board);
        setCurrentTurn(data.player);
        setWinner(data.winner);
      }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);

    socket.onclose = () => console.log("WebSocket closed");

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleClick = (row, col) => {
    if (!ws || board[row][col] !== "" || winner || player !== currentTurn) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "move",
        row,
        col,
      }),
    );
  };

  const handleReset = () => {
    if (!ws) return;

    ws.send(
      JSON.stringify({
        type: "reset",
        row: 0,
        col: 0, // ignored
      }),
    );
  };

  const renderCell = (row, col) => (
    <div
      className={`cell cell-${board[row][col] ? board[row][col] : "empty"}`}
      onClick={() => handleClick(row, col)}
      key={`${row}-${col}`}
    >
      {board[row][col]}
    </div>
  );

  return (
    <div className="App">
      <h1>Multiplayer Tic-Tac-Toe</h1>
      <h2>
        You are Player: {player} | Current Turn: {currentTurn}
      </h2>
      {winner && <h2 className="winner">Winner: {winner}</h2>}
      <div className="board">
        {board.map((rowArr, row) => (
          <div className="row" key={row}>
            {rowArr.map((_, col) => renderCell(row, col))}
          </div>
        ))}
      </div>
      <div className="controls">
        <button onClick={handleReset}>Reset Game</button>
      </div>
    </div>
  );
}

export default App;
