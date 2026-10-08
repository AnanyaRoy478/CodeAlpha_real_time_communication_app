import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [roomName, setRoomName] = useState("");

  const [joinRoomId, setJoinRoomId] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await api.post("/rooms", {
        name: roomName,
      });

      const roomId = response.data.room.roomId;

      navigate(`/room/${roomId}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create room"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    navigate(`/room/${joinRoomId.trim()}`);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Real-Time Collaboration</h2>

        <button
          style={styles.logout}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main style={styles.main}>
        <h1>
          Welcome, {user?.name}!
        </h1>

        <p>
          {user?.email}
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.cards}>
          <div style={styles.card}>
            <h2>Create Meeting</h2>

            <p>
              Create a new collaboration room.
            </p>

            <input
              type="text"
              placeholder="Meeting name"
              value={roomName}
              onChange={(event) =>
                setRoomName(event.target.value)
              }
            />

            <button
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Meeting"}
            </button>
          </div>

          <div style={styles.card}>
            <h2>Join Meeting</h2>

            <p>
              Enter the room ID shared with you.
            </p>

            <input
              type="text"
              placeholder="Room ID"
              value={joinRoomId}
              onChange={(event) =>
                setJoinRoomId(event.target.value)
              }
            />

            <button
              onClick={handleJoinRoom}
            >
              Join Meeting
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f7fb",
  },

  header: {
    height: "70px",
    padding: "0 30px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  logout: {
    width: "100px",
    background: "#dc2626",
  },

  main: {
    padding: "40px",
  },

  cards: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "30px",
  },

  card: {
    width: "350px",
    padding: "25px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  },

  error: {
    maxWidth: "700px",
    marginTop: "20px",
    padding: "12px",
    background: "#ffe5e5",
    color: "#b00020",
    borderRadius: "6px",
  },
};

export default Dashboard;