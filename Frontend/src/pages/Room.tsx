import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

const URL = 'http://localhost:3000'

const About = ({
    name,
    localAudioTrack,
    localVideoTrack
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [socket, setSocket] = useState<null | Socket>(null)
    const [lobby, setLobby] = useState(true)
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null)
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
    const localVideoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const socket = io(URL)

        socket.on("send-offer", async ({ roomId }) => {
            console.log("sending offer")
            setLobby(false)

            const pc = new RTCPeerConnection()
            setSendingPc(pc)

            if (localVideoTrack) {
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally")
                if (e.candidate) {
                    socket.emit('add-ice-candidate', {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation needed, sending offer")
                const sdp = await pc.createOffer()
                // @ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId,
                })
            }
        })

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            setLobby(false)

            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()

            // @ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream()
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }

            setRemoteMediaStream(stream)

            // trickel ICE
            setReceivingPc(pc)

            pc.onicecandidate = async (e) => {
                console.log("on ice candidate on receiving side")
                if (e.candidate) {
                    socket.emit('add-ice-candidate', {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    })
                }
            }

            // pc.ontrack = ({ track, type }) => {
            // if (type == 'audio') {
            //     // setRemoteAudioTrack(track)
            // } else {
            //     // setRemoteVideoTrack(track)
            // }
            // }

            socket.emit("answer", {
                roomId,
                sdp: sdp,
            })

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                if (track1.kind == "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                // @ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                // @ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                // @ts-ignore
                remoteVideoRef.current.play()
            }, 5000)
        })

        socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
            setLobby(false)
            setSendingPc((pc) => {
                pc?.setRemoteDescription(remoteSdp)
                return pc
            })
            console.log("loop closed")
        })

        socket.on("lobby", () => {
            setLobby(true)
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            console.log("add ice candidate from remote")
            console.log({ candidate, type })
            if (type == "sender") {
                setReceivingPc((pc) => {
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            } else {
                setSendingPc((pc) => {
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            }
        })

        setSocket(socket)
    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack])
                localVideoRef.current.play()
            }
        }
    }, [localVideoRef])

    return (
        <div>
            Hi, {name}!
            <video width={400} height={400} autoPlay ref={localVideoRef}></video>
            {lobby ? "Waiting for other user to connect..." : null}
            <video width={400} height={400} autoPlay ref={remoteVideoRef}></video>
        </div>
    )
}

export default About
