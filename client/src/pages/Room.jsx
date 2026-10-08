import { useNavigate, useParams } from "react-router-dom";

import useWebRTC from "../hooks/useWebRTC";

const Room = () => {
    const { roomId } = useParams();

    const navigate = useNavigate();

    const {
        localVideoRef,
        remoteStreams,
        isMuted,
        isCameraOff,
        toggleMicrophone,
        toggleCamera,
    } = useWebRTC(roomId);

    const remoteUsers = Object.entries(
        remoteStreams
    );

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h2>Video Meeting</h2>

                    <p>
                        Room ID:{" "}
                        <strong>{roomId}</strong>
                    </p>
                </div>

                <button
                    style={styles.leaveButton}
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    Leave
                </button>
            </header>

            <main style={styles.main}>
                <div style={styles.videoGrid}>
                    {/* LOCAL VIDEO */}
                    <div style={styles.videoCard}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={styles.video}
                        />

                        <div style={styles.label}>
                            You
                        </div>
                    </div>

                    {/* REMOTE VIDEOS */}
                    {remoteUsers.map(
                        ([socketId, stream]) => (
                            <RemoteVideo
                                key={socketId}
                                socketId={socketId}
                                stream={stream}
                            />
                        )
                    )}
                </div>

                {remoteUsers.length === 0 && (
                    <div style={styles.waiting}>
                        <h2>
                            Waiting for another participant...
                        </h2>

                        <p>
                            Share this room ID with another
                            user:
                        </p>

                        <strong>{roomId}</strong>
                    </div>
                )}
            </main>

            <footer style={styles.controls}>
                <button
                    onClick={toggleMicrophone}
                    style={
                        isMuted
                            ? styles.activeButton
                            : styles.controlButton
                    }
                >
                    {isMuted
                        ? "🔇 Unmute"
                        : "🎤 Mute"}
                </button>

                <button
                    onClick={toggleCamera}
                    style={
                        isCameraOff
                            ? styles.activeButton
                            : styles.controlButton
                    }
                >
                    {isCameraOff
                        ? "📷 Turn Camera On"
                        : "📹 Turn Camera Off"}
                </button>

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    style={styles.leaveButton}
                >
                    📞 Leave Call
                </button>
            </footer>
        </div>
    );
};

const RemoteVideo = ({
    socketId,
    stream,
}) => {
    const videoRef = (element) => {
        if (element && element.srcObject !== stream) {
            element.srcObject = stream;
        }
    };

    return (
        <div style={styles.videoCard}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={styles.video}
            />

            <div style={styles.label}>
                Participant
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        display: "flex",
        flexDirection: "column",
    },

    header: {
        minHeight: "80px",
        padding: "15px 25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1f2937",
    },

    container: {
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        display: "flex",
        flexDirection: "column",
    },

    header: {
        minHeight: "80px",
        padding: "15px 25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1f2937",
    },

    main: {
        flex: 1,
        padding: "25px",
    },

    videoGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },

    videoCard: {
        position: "relative",
        background: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        minHeight: "250px",
        border: "1px solid #374151",
    },

    video: {
        width: "100%",
        height: "100%",
        minHeight: "250px",
        objectFit: "cover",
        display: "block",
    },

    label: {
        position: "absolute",
        bottom: "10px",
        left: "10px",
        padding: "6px 10px",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "5px",
    },

    waiting: {
        marginTop: "30px",
        padding: "30px",
        textAlign: "center",
        background: "#1f2937",
        borderRadius: "12px",
    },

    controls: {
        minHeight: "90px",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "15px",
        background: "#1f2937",
        flexWrap: "wrap",
    },

    controlButton: {
        width: "auto",
        padding: "12px 20px",
        background: "#374151",
    },

    activeButton: {
        width: "auto",
        padding: "12px 20px",
        background: "#dc2626",
    },

    leaveButton: {
        width: "auto",
        padding: "12px 20px",
        background: "#dc2626",
    },
};

export default Room;