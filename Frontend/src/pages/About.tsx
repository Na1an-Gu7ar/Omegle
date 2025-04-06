import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

const URL = 'http://localhost:3000'

const About = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get('name') || 'Guest'
    const [socket, setSocket] = useState<null | Socket>(null)

    useEffect(() => {
        const socket = io(URL, {
            // transports: ['websocket'],
            autoConnect: false,
        })
        setSocket(socket)
    }, [name])
    
    return (
        <div>
            Hi, {name}!
        </div>
    )
}

export default About
