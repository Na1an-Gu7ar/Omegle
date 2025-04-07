import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

const URL = 'http://localhost:3000'

const About = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get('name') || 'Guest'
    const [socket, setSocket] = useState<null | Socket>(null)
    const [lobby, setLobby] = useState(true)

    useEffect(() => {
        const socket = io(URL)

        socket.on("send-offer", ({roomId}) => {
            alert("send offer please")
            setLobby(false)
            socket.emit("offer", {
                sdp: "",
                roomId,
            })
        })

        socket.on("offer", ({roomId, offer}) => {
            alert("send answer please")
            setLobby(false)
            socket.emit("answer", {
                roomId,
                sdp: "",
            })
        })

        socket.on("answer", ({roomId, answer}) => {
            setLobby(false)
            alert("connection done")
        })

        socket.on("lobby", () => {
            setLobby(true)
        })

        setSocket(socket)
    }, [name])

    if (lobby) {
        return (
            <div>
                Waiting for other user to connect...
            </div>
        )
    }
    
    return (
        <div>
            Hi, {name}!
            <video width={400} height={400} autoPlay playsInline></video>
            <video width={400} height={400} autoPlay playsInline></video>
        </div>
    )
}

export default About
