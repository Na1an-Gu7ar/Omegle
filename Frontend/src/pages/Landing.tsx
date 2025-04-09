import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

const Home = () => {
    const [name, setName] = useState('')
    const [joined, setJoined] = useState(false)
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: true
        })

        // MediaStreamTrack is a type of MediaStream that represents a single track of media (audio or video)
        const videoTracks = stream.getVideoTracks()[0]
        const audioTracks = stream.getAudioTracks()[0]
        setLocalVideoTrack(videoTracks)
        setLocalAudioTrack(audioTracks)

        if(!videoRef.current) {
            return
        }
        videoRef.current.srcObject = new MediaStream([videoTracks])
        videoRef.current.play()// Play the video
    }

    useEffect(() => {
        if(videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef])

    return (
        <div>
            <video autoPlay ref={videoRef}></video>
            <input type="text" onChange={(e) => setName(e.target.value)}/>
            <Link to={`/about?name=${name}`}>About</Link>
        </div>
    )
}

export default Home
