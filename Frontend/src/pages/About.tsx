import { useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"

const About = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get('name') || 'Guest'

    useEffect(() => {
        
    }, [name])
    
    return (
        <div>
            Hi, {name}!
        </div>
    )
}

export default About
