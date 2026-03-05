import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import App from "./App";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  sentMessages: any[] = [];

  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;

  constructor() {
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen && this.onopen(), 0);
  }

  send(message: string) {
    this.sentMessages.push(JSON.parse(message));
  }

  close() {}
}

(global as any).WebSocket = MockWebSocket;

describe("App UI Tests", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
  });

  test("renders initial UI with 9 cells", () => {
    render(<App />);

    const cells = screen.getAllByTestId(/cell-/i);
    expect(cells).toHaveLength(9);
  });

  test("receives player assignment and updates UI", async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onmessage?.({
        data: JSON.stringify({ type: "player", player: "X" }),
      });
    });

    expect(await screen.findByText(/You are: X/i)).toBeInTheDocument();
  });

  test("clicking empty cell sends move", async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onmessage?.({
        data: JSON.stringify({ type: "player", player: "X" }),
      });

      ws.onmessage?.({
        data: JSON.stringify({
          board: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
          ],
          player: "X",
          winner: "",
        }),
      });
    });

    const cell = await screen.findByTestId("cell-0-0");

    fireEvent.click(cell);

    expect(ws.sentMessages).toContainEqual({
      type: "move",
      row: 0,
      col: 0,
    });
  });

  test("clicking non-empty cell does not send move", async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onmessage?.({
        data: JSON.stringify({ type: "player", player: "X" }),
      });

      ws.onmessage?.({
        data: JSON.stringify({
          board: [
            ["X", "", ""],
            ["", "", ""],
            ["", "", ""],
          ],
          player: "X",
          winner: "",
        }),
      });
    });

    const cell = await screen.findByTestId("cell-0-0");

    fireEvent.click(cell);

    expect(ws.sentMessages).toHaveLength(0);
  });

  test("reset button sends reset message", () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    const resetButton = screen.getByText(/Reset Game/i);

    fireEvent.click(resetButton);

    expect(ws.sentMessages).toContainEqual({
      type: "reset",
    });
  });

  test("displays winner when received from server", async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onmessage?.({
        data: JSON.stringify({ type: "player", player: "X" }),
      });

      ws.onmessage?.({
        data: JSON.stringify({
          board: [
            ["X", "X", "X"],
            ["O", "O", ""],
            ["", "", ""],
          ],
          player: "O",
          winner: "X",
        }),
      });
    });

    expect(await screen.findByText(/Winner: X/i)).toBeInTheDocument();
  });
});