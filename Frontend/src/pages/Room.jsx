import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import socket from '../socket'

const Room = () => {
    const { roomId } = useParams()
    const userId = useRef(Math.floor(Math.random() * 10000)).current

    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)

    const peerConnection = useRef(null)
    const localStream = useRef(null)
    const [connectedUser, setConnectedUser] = useState(null)
    const [streamReady, setStreamReady] = useState(false)

    useEffect(() => {
        // Get camera/mic first
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStream.current = stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }
                setStreamReady(true)
                socket.emit("join-room", roomId, userId)
            })
            .catch((err) => {
                console.error("Media error:", err)
            })

        return () => {
            socket.emit("leave-room", roomId, userId)
        }
    }, [roomId, userId])

    useEffect(() => {
        if (!streamReady) return

        socket.on("user-joined", async (otherUserId) => {
            console.log(`[${userId}] User joined: ${otherUserId}`)
            setConnectedUser(otherUserId)

            await createPeerConnection()

            localStream.current.getTracks().forEach((track) => {
                peerConnection.current.addTrack(track, localStream.current)
            })

            const offer = await peerConnection.current.createOffer()
            await peerConnection.current.setLocalDescription(offer)

            socket.emit("send-signal", {
                to: otherUserId,
                from: userId,
                signal: offer,
            })
        })

        socket.on("receive-signal", async ({ from, signal }) => {
            console.log(`[${userId}] Received signal from ${from}`)

            if (!peerConnection.current) {
                await createPeerConnection()
                localStream.current.getTracks().forEach((track) => {
                    peerConnection.current.addTrack(track, localStream.current)
                })
            }

            if (signal.type === "offer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal))
                const answer = await peerConnection.current.createAnswer()
                await peerConnection.current.setLocalDescription(answer)

                socket.emit("send-signal", {
                    to: from,
                    from: userId,
                    signal: answer,
                })
            } else if (signal.type === "answer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal))
            } else if (signal.candidate) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal))
                } catch (error) {
                    console.error("Error adding ICE candidate", error)
                }
            }
        })

    }, [streamReady])

    const createPeerConnection = async () => {
        peerConnection.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        })

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate && connectedUser) {
                socket.emit("send-signal", {
                    to: connectedUser,
                    from: userId,
                    signal: event.candidate,
                })
            }
        }

        peerConnection.current.ontrack = (event) => {
            console.log(`[${userId}] Received remote stream`)
            if (remoteVideoRef.current && event.streams.length > 0) {
                remoteVideoRef.current.srcObject = event.streams[0]
            } else {
                console.warn("Remote video ref not ready or no stream")
            }
        }
    }

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Meeting Room: {roomId}</h2>
            <p>Your ID: {userId}</p>
            <video autoPlay playsInline ref={localVideoRef} muted style={{ width: "40%" }} />
            <video autoPlay playsInline ref={remoteVideoRef} style={{ width: "40%", marginLeft: "10px" }} />
        </div>
    )
}

export default Room
