


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
// export const Header = () => {
//   return (
//     <div className="flex items-center justify-center px-3 pt-6 lg:-mb-8">
//       <div className="flex items-center space-x-3">
//         <h2 className="text-2xl sm:text-[18px] font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text text-center drop-shadow-md">
//           GREWE Scanner Interface Cloud Version
//           <br className="hidden sm:block" />
//         </h2>
//       </div>
//     </div>
//   )
// }
