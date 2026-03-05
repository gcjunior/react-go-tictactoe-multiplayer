import { useEffect, useState } from "react";
import "./App.css";

type Board = string[][];

type GameState = {
  board: Board;
  player: string;
  winner: string;
};

function App() {
  const [board, setBoard] = useState<Board>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);

  const [player, setPlayer] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState<string>("X");
  const [winner, setWinner] = useState<string>("");

  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // secure
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

    socket.onopen = () => {
      console.log("connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "player") {
        setPlayer(data.player);
      } else {
        const state: GameState = data;
        setBoard(state.board);
        setCurrentTurn(state.player);
        setWinner(state.winner);
      }
    };

    setWs(socket);

    return () => socket.close();
  }, []);

  const handleClick = (row: number, col: number) => {
    if (!ws) return;

    if (board[row][col] !== "") return;
    if (winner) return;
    if (player !== currentTurn) return;

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
      }),
    );
  };

  const renderCell = (row: number, col: number) => {
    return (
      <div
        key={`${row}-${col}`}
        className={`cell cell-${board[row][col] || "empty"}`}
        onClick={() => handleClick(row, col)}
      >
        {board[row][col]}
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Tic Tac Toe Multiplayer</h1>

      <h2>
        You are: {player} | Turn: {currentTurn}
      </h2>

      {winner && <h2 className="winner">Winner: {winner}</h2>}

      <div className="board">
        {board.map((r, row) => (
          <div className="row" key={row}>
            {r.map((_, col) => renderCell(row, col))}
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
