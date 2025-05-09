import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';

const Room = () => {
    const { roomId } = useParams();
    const userId = useRef(Math.floor(Math.random() * 10000)).current;

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const [connectedUser, setConnectedUser] = useState(null);
    const [streamReady, setStreamReady] = useState(false);
    const isInitiator = useRef(false);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStream.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setStreamReady(true);
            })
            .catch((err) => {
                console.error("Media error:", err);
            });

        return () => {
            socket.emit("leave-room", roomId, userId);
        };
    }, [roomId, userId]);

    useEffect(() => {
        if (!streamReady) return;

        socket.emit("join-room", roomId, userId);

        socket.on("room-joined", async ({ initiator }) => {
            console.log("Room joined. Am I initiator?", initiator);
            isInitiator.current = initiator;
            await createPeerConnection();
        });

        socket.on("user-joined", async (otherUserId) => {
            console.log("User joined:", otherUserId);
            setConnectedUser(otherUserId);

            if (isInitiator.current && peerConnection.current) {
                console.log("Creating and sending offer to", otherUserId);
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                socket.emit("send-signal", {
                    to: otherUserId,
                    from: userId,
                    signal: offer,
                });
            }
        });

        socket.on("receive-signal", async ({ from, signal }) => {
            console.log("Signal received:", signal);
            if (!peerConnection.current) {
                await createPeerConnection();
            }

            if (signal.type === "offer") {
                console.log("Received offer. Sending answer.");
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                socket.emit("send-signal", {
                    to: from,
                    from: userId,
                    signal: answer,
                });
            } else if (signal.type === "answer") {
                console.log("Received answer.");
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
                try {
                    console.log("Adding ICE candidate");
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal));
                } catch (error) {
                    console.error("Error adding ICE candidate", error);
                }
            }
        });

        socket.on("user-disconnected", (disconnectedUserId) => {
            console.log("User disconnected:", disconnectedUserId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        });

        return () => {
            socket.off("room-joined");
            socket.off("user-joined");
            socket.off("receive-signal");
            socket.off("user-disconnected");
        };
    }, [streamReady]);

    useEffect(() => {
        // Wait a bit and log the remote video stream (for debugging)
        const timeout = setTimeout(() => {
            if (remoteVideoRef.current?.srcObject) {
                console.log("Remote video element has stream:", remoteVideoRef.current.srcObject);
            } else {
                console.warn("Remote video element has NO stream");
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);

    const createPeerConnection = async () => {
        peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate && connectedUser) {
                console.log("Sending ICE candidate");
                socket.emit("send-signal", {
                    to: connectedUser,
                    from: userId,
                    signal: event.candidate,
                });
            }
        };

        peerConnection.current.ontrack = (event) => {
            const incomingStream = event.streams[0];
            console.log("Received remote track:", incomingStream);

            if (remoteVideoRef.current) {
                // Only assign if not already set
                if (remoteVideoRef.current.srcObject !== incomingStream) {
                    remoteVideoRef.current.srcObject = incomingStream;

                    setTimeout(() => {
                        remoteVideoRef.current
                            .play()
                            .then(() => {
                                console.log("Remote video playing.");
                            })
                            .catch((err) => {
                                console.error("Error playing remote video:", err);
                            });
                    }, 100); // small delay ensures the stream is loaded
                } else {
                    console.log("Stream already assigned to remote video.");
                }
            }
        };

        localStream.current.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, localStream.current);
        });
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Meeting Room: {roomId}</h2>
            <p>Your ID: {userId}</p>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "40%", height: "40%" }} />
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "40%", marginLeft: "10px", height: "40%" }} />
        </div>
    );
};

export default Room;
