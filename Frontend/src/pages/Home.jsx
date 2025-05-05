import React from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

const Home = () => {
    const navigate = useNavigate()
    const [roomId, setRoomId] = React.useState('')

    const createNewRoom = () => {
        const newRoomId = uuidv4()
        navigate(`/room/${newRoomId}`)
    }

    const joinRoom = () => {
        if (roomId.trim()) {
            navigate(`/room/${roomId}`)
        }
    }

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Video Meeting App</h1>
            <button onClick={createNewRoom}>Create New Meeting</button>
            <div style={{ marginTop: "20px" }}>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={joinRoom} style={{ marginLeft: "10px" }}>
                    Join Meeting
                </button>
            </div>
        </div>
    )
}

export default Home
