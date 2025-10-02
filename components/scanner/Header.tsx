


import Image from "next/image"
import Logo from "@/public/grewescanner.png"

export const Header = () => {
  return (
    <div className="flex items-center relative justify-center px-3 pt-6 mt-5 lg:-mb-8">
      <Image
        src={Logo}
        alt="Grewe Scanner Logo"
        className="h-16 w-auto drop-shadow-lg absolute top-0.5 -mt-[5px]"
        priority
      />
    </div>
  )
}
export default Header

