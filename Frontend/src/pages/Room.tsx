import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

const URL = 'http://localhost:3000'

const About = ({
    name, 
    localAudioTrack,
    localVideoTrack
} : {
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

        socket.on("send-offer", async ({roomId}) => {
            setLobby(false)

            const pc = new RTCPeerConnection()
            setSendingPc(pc)

            if(localVideoTrack) {
                pc.addTrack(localVideoTrack)
            }
            if(localAudioTrack) {
                pc.addTrack(localAudioTrack)
            }

            // pc.onicecandidate = async (e) => {
            //     if(e.candidate){
            //         pc.addIceCandidate(e.candidate)
            //     }
            // }
            
            pc.onnegotiationneeded = async () => {
                alert("Negotiation needed")
                
                const sdp = await pc.createOffer()
                socket.emit("offer", {
                    sdp,
                    roomId,
                })
            }
        })

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            setLobby(false)
            
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(remoteSdp)

            const sdp = await pc.createAnswer()

            const stream = new MediaStream()
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }

            setRemoteMediaStream(stream)

            // trickel ICE
            setReceivingPc(pc)
            pc.ontrack = (({track, type}) => {
                if (type == 'audio') {
                    // setRemoteAudioTrack(track)
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else {
                    // setRemoteVideoTrack(track)
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                // @ts-ignore
                remoteVideoRef.current.play()
            })

            socket.emit("answer", {
                roomId,
                sdp: sdp,
            })
        })

        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            setLobby(false)
            setSendingPc((pc) => {
                pc?.setRemoteDescription(remoteSdp)
                return pc
            })
        })

        socket.on("lobby", () => {
            setLobby(true)
        })

        setSocket(socket)
    }, [name])
    
    useEffect(() => {
        if(localVideoRef.current) {
            if(localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack])
                localVideoRef.current.play()
            }
        }
    }, [localVideoRef])

    return (
        <div>
            Hi, {name}!
            {lobby ? "Waiting for other user to connect..." : null}
            <video width={400} height={400} autoPlay ref={localVideoRef}></video>
            <video width={400} height={400} autoPlay ref={remoteVideoRef}></video>
        </div>
    )
}

export default About
