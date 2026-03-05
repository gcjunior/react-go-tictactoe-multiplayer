// backend/main_test.go
package main

import (
	"testing"
)

// ---------- Helper to reset clients ----------

func resetClients() {
	mu.Lock()
	defer mu.Unlock()
	for c := range clients {
		delete(clients, c)
	}
}

// ---------- Game Logic Tests ----------

func TestNewGame(t *testing.T) {
	newGame()
	if game.Player != "X" {
		t.Errorf("expected starting player X, got %s", game.Player)
	}
	if game.Winner != "" {
		t.Errorf("expected no winner, got %s", game.Winner)
	}
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if game.Board[i][j] != "" {
				t.Errorf("expected empty board at %d,%d", i, j)
			}
		}
	}
}

func TestCheckWinnerRows(t *testing.T) {
	newGame()
	game.Board[0] = [3]string{"X", "X", "X"}
	if !checkWinner("X") {
		t.Errorf("expected X to be winner by row")
	}
}

func TestCheckWinnerCols(t *testing.T) {
	newGame()
	for i := 0; i < 3; i++ {
		game.Board[i][1] = "O"
	}
	if !checkWinner("O") {
		t.Errorf("expected O to be winner by column")
	}
}

func TestCheckWinnerDiagonals(t *testing.T) {
	newGame()
	game.Board[0][0] = "X"
	game.Board[1][1] = "X"
	game.Board[2][2] = "X"
	if !checkWinner("X") {
		t.Errorf("expected X to be winner by diagonal")
	}
}

// ---------- Handle Move Tests ----------

func TestHandleMove(t *testing.T) {
	newGame()
	resetClients()

	client := &Client{
		player: "X",
		conn:   &MockConn{},
	}
	clients[client] = true

	move := Move{Type: "move", Row: 0, Col: 0}
	handleMove(move, client)

	if game.Board[0][0] != "X" {
		t.Errorf("expected cell 0,0 to be X")
	}
	if game.Player != "O" {
		t.Errorf("expected next player O, got %s", game.Player)
	}
}

// ---------- Reset Game Test ----------

func TestResetGame(t *testing.T) {
	newGame()
	resetClients()

	game.Board[0][0] = "X"
	client := &Client{
		player: "X",
		conn:   &MockConn{},
	}
	clients[client] = true

	// Directly call newGame() to reset
	newGame()

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if game.Board[i][j] != "" {
				t.Errorf("expected board reset at %d,%d", i, j)
			}
		}
	}
}

// ---------- HandleMove Winner Switching Test ----------

func TestHandleMoveWinner(t *testing.T) {
	newGame()
	resetClients()

	clientX := &Client{player: "X", conn: &MockConn{}}
	clientO := &Client{player: "O", conn: &MockConn{}}
	clients[clientX] = true
	clients[clientO] = true

	// X moves
	handleMove(Move{Type: "move", Row: 0, Col: 0}, clientX)
	// O moves
	handleMove(Move{Type: "move", Row: 1, Col: 0}, clientO)
	// X moves
	handleMove(Move{Type: "move", Row: 0, Col: 1}, clientX)
	// O moves
	handleMove(Move{Type: "move", Row: 1, Col: 1}, clientO)
	// X moves - winning move
	handleMove(Move{Type: "move", Row: 0, Col: 2}, clientX)

	if game.Winner != "X" {
		t.Errorf("expected winner X, got %s", game.Winner)
	}
}
