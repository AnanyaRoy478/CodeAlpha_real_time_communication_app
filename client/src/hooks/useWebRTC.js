import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../services/socket";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const useWebRTC = (roomId) => {
  const localVideoRef = useRef(null);

  const localStreamRef = useRef(null);

  const peerConnectionsRef = useRef({});

  const [remoteStreams, setRemoteStreams] =
    useState({});

  const [isMuted, setIsMuted] = useState(false);

  const [isCameraOff, setIsCameraOff] =
    useState(false);

  const removePeer = useCallback(
    (remoteSocketId) => {
      const peerConnection =
        peerConnectionsRef.current[
          remoteSocketId
        ];

      if (peerConnection) {
        peerConnection.close();
      }

      delete peerConnectionsRef.current[
        remoteSocketId
      ];

      setRemoteStreams((previous) => {
        const updated = {
          ...previous,
        };

        delete updated[remoteSocketId];

        return updated;
      });
    },
    []
  );

  const createPeerConnection = useCallback(
    (remoteSocketId) => {
      if (
        peerConnectionsRef.current[
          remoteSocketId
        ]
      ) {
        return peerConnectionsRef.current[
          remoteSocketId
        ];
      }

      const peerConnection =
        new RTCPeerConnection(
          ICE_SERVERS
        );

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(
              track,
              localStreamRef.current
            );
          });
      }

      peerConnection.ontrack = (event) => {
        const remoteStream =
          event.streams[0];

        if (!remoteStream) {
          return;
        }

        setRemoteStreams((previous) => ({
          ...previous,
          [remoteSocketId]: remoteStream,
        }));
      };

      peerConnection.onicecandidate = (
        event
      ) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            target: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.onconnectionstatechange =
        () => {
          console.log(
            `WebRTC connection ${remoteSocketId}:`,
            peerConnection.connectionState
          );

          if (
            peerConnection.connectionState ===
              "failed" ||
            peerConnection.connectionState ===
              "closed" ||
            peerConnection.connectionState ===
              "disconnected"
          ) {
            removePeer(remoteSocketId);
          }
        };

      peerConnectionsRef.current[
        remoteSocketId
      ] = peerConnection;

      return peerConnection;
    },
    [removePeer]
  );

  const createOffer = useCallback(
    async (remoteSocketId) => {
      try {
        const peerConnection =
          createPeerConnection(
            remoteSocketId
          );

        const offer =
          await peerConnection.createOffer();

        await peerConnection.setLocalDescription(
          offer
        );

        socket.emit("offer", {
          target: remoteSocketId,
          offer,
        });
      } catch (error) {
        console.error(
          "Offer creation failed:",
          error
        );
      }
    },
    [createPeerConnection]
  );

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: true,
            }
          );

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject =
            stream;
        }

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit(
          "join-room",
          roomId
        );
      } catch (error) {
        console.error(
          "Camera/microphone error:",
          error
        );

        alert(
          "Unable to access camera or microphone. Please allow camera and microphone permissions."
        );
      }
    };

    const handleUserJoined = ({
      socketId,
    }) => {
      console.log(
        "New user joined:",
        socketId
      );

      createOffer(socketId);
    };

    const handleOffer = async ({
      sender,
      offer,
    }) => {
      try {
        const peerConnection =
          createPeerConnection(sender);

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        const answer =
          await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
          answer
        );

        socket.emit("answer", {
          target: sender,
          answer,
        });
      } catch (error) {
        console.error(
          "Offer handling failed:",
          error
        );
      }
    };

    const handleAnswer = async ({
      sender,
      answer,
    }) => {
      try {
        const peerConnection =
          peerConnectionsRef.current[
            sender
          ];

        if (!peerConnection) {
          console.error(
            "Peer connection does not exist:",
            sender
          );

          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );
      } catch (error) {
        console.error(
          "Answer handling failed:",
          error
        );
      }
    };

    const handleIceCandidate = async ({
      sender,
      candidate,
    }) => {
      try {
        const peerConnection =
          peerConnectionsRef.current[
            sender
          ];

        if (!peerConnection || !candidate) {
          return;
        }

        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "ICE candidate failed:",
          error
        );
      }
    };

    const handleUserLeft = ({
      socketId,
    }) => {
      console.log(
        "User left:",
        socketId
      );

      removePeer(socketId);
    };

    socket.on(
      "user-joined",
      handleUserJoined
    );

    socket.on(
      "offer",
      handleOffer
    );

    socket.on(
      "answer",
      handleAnswer
    );

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    socket.on(
      "user-left",
      handleUserLeft
    );

    startCamera();

    return () => {
      cancelled = true;

      socket.off(
        "user-joined",
        handleUserJoined
      );

      socket.off(
        "offer",
        handleOffer
      );

      socket.off(
        "answer",
        handleAnswer
      );

      socket.off(
        "ice-candidate",
        handleIceCandidate
      );

      socket.off(
        "user-left",
        handleUserLeft
      );

      Object.values(
        peerConnectionsRef.current
      ).forEach((peerConnection) => {
        peerConnection.close();
      });

      peerConnectionsRef.current = {};

      setRemoteStreams({});

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRef.current = null;
      }

      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [
    roomId,
    createOffer,
    createPeerConnection,
    removePeer,
  ]);

  const toggleMicrophone = useCallback(() => {
    if (!localStreamRef.current) {
      return;
    }

    const audioTracks =
      localStreamRef.current.getAudioTracks();

    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted((previous) => !previous);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) {
      return;
    }

    const videoTracks =
      localStreamRef.current.getVideoTracks();

    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsCameraOff((previous) => !previous);
  }, []);

  return {
    localVideoRef,
    remoteStreams,
    isMuted,
    isCameraOff,
    toggleMicrophone,
    toggleCamera,
  };
};

export default useWebRTC;