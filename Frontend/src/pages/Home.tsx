import { useState } from "react"
import { Link } from "react-router-dom"

const Home = () => {
    const [name, setName] = useState('')

    return (
        <div>
            <input type="text" onChange={(e) => setName(e.target.value)}/>
            <Link to={`/about?name=${name}`}>About</Link>
        </div>
    )
}

export default Home
