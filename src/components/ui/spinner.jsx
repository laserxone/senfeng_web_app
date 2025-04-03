const { Loader2 } = require("lucide-react")


const Spinner = ({className}) => {
    return (
        <Loader2 className={`animate-spin ${className}`}/>
    )
}

export default Spinner