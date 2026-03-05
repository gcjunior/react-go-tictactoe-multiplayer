// backend/mock_conn.go
package main

// MockConn implements minimal WriteJSON for testing
type MockConn struct{}

func (m *MockConn) WriteJSON(v interface{}) error {
	// Do nothing, just pretend
	return nil
}

func (m *MockConn) Close() error {
	return nil
}

// Implement other methods if needed
func (m *MockConn) WriteMessage(messageType int, data []byte) error     { return nil }
func (m *MockConn) ReadMessage() (messageType int, p []byte, err error) { return 0, nil, nil }
