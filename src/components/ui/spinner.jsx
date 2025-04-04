const { Loader2 } = require("lucide-react")


const Spinner = ({className, size}) => {
    return (
        <Loader2 className={`animate-spin ${className}`} size={size}/>
    )
}

export default Spinner