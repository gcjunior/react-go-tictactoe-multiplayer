package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Game struct {
	Board  [3][3]string `json:"board"`
	Player string       `json:"player"`
	Winner string       `json:"winner"`
}

type Move struct {
	Type string `json:"type"` // "move" or "reset"
	Row  int    `json:"row"`
	Col  int    `json:"col"`
}

type Client struct {
	conn   *websocket.Conn
	player string
}

var game Game
var clients = make(map[*Client]bool)
var mu sync.Mutex

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {

		origin := r.Header.Get("Origin")

		if origin == "http://localhost:5173" ||
			origin == "http://127.0.0.1:5173" {
			return true
		}

		// allow everything in development
		return true
	},
}

func newGame() {

	game = Game{
		Board:  [3][3]string{},
		Player: "X",
		Winner: "",
	}
}

func checkWinner(player string) bool {

	board := game.Board

	for i := 0; i < 3; i++ {

		if board[i][0] == player &&
			board[i][1] == player &&
			board[i][2] == player {
			return true
		}

		if board[0][i] == player &&
			board[1][i] == player &&
			board[2][i] == player {
			return true
		}
	}

	if board[0][0] == player &&
		board[1][1] == player &&
		board[2][2] == player {
		return true
	}

	if board[0][2] == player &&
		board[1][1] == player &&
		board[2][0] == player {
		return true
	}

	return false
}

func broadcastGame() {

	for client := range clients {

		err := client.conn.WriteJSON(game)
		if err != nil {

			log.Println("Write error:", err)

			client.conn.Close()

			delete(clients, client)
		}
	}
}

func handleMove(move Move, client *Client) {

	mu.Lock()
	defer mu.Unlock()

	if game.Winner != "" {
		return
	}

	if client.player != game.Player {
		return
	}

	if move.Row < 0 || move.Row > 2 ||
		move.Col < 0 || move.Col > 2 {
		return
	}

	if game.Board[move.Row][move.Col] != "" {
		return
	}

	game.Board[move.Row][move.Col] = game.Player

	if checkWinner(game.Player) {

		game.Winner = game.Player

	} else {

		if game.Player == "X" {
			game.Player = "O"
		} else {
			game.Player = "X"
		}
	}

	broadcastGame()
}

func handleConnection(w http.ResponseWriter, r *http.Request) {

	log.Println("Incoming connection attempt")
	log.Println("Headers:", r.Header)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {

		log.Println("Upgrade failed:", err)
		return
	}

	log.Println("WebSocket successfully connected")

	client := &Client{
		conn: conn,
	}

	mu.Lock()

	if len(clients) == 0 {

		client.player = "X"

	} else if len(clients) == 1 {

		client.player = "O"

	} else {

		conn.WriteMessage(
			websocket.TextMessage,
			[]byte("Game full"),
		)

		conn.Close()
		mu.Unlock()

		return
	}

	clients[client] = true
	mu.Unlock()

	// send player assignment
	conn.WriteJSON(map[string]string{
		"type":   "player",
		"player": client.player,
	})

	// send current game state
	conn.WriteJSON(game)

	for {

		var move Move

		err := conn.ReadJSON(&move)
		if err != nil {

			log.Println("Client disconnected:", err)

			mu.Lock()
			delete(clients, client)
			mu.Unlock()

			conn.Close()

			break
		}

		log.Println("Received move:", move)

		switch move.Type {
		case "move":
			handleMove(move, client)
		case "reset":
			mu.Lock()
			newGame()
			mu.Unlock()
			broadcastGame()
		}
	}
}

func main() {

	newGame()

	http.HandleFunc("/ws", handleConnection)

	log.Println("Server running on :8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {

		log.Fatal("Server error:", err)
	}
}
