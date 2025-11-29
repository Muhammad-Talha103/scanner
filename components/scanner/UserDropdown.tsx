//components/scanner/UserDropdown.tsx

"use client";

import { RootState } from "@/redux/store";
import { client } from "@/sanity/lib/client";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { useSelector } from "react-redux";
import { GrUpgrade } from "react-icons/gr";
import { IoMdLogIn } from "react-icons/io";

interface UserDropdownProps {
  isOpen: boolean;
  userName: string | null;
  userEmail: string;
  onLogout: () => void;
}

interface PremiumUser {
  _id?: string;
  email: string;
  name?: string;
  payments?: unknown[];
  premiumStart?: string;
  premiumEnd?: string;
}

export const UserDropdown = ({
  isOpen,
  userName,
  userEmail,
  onLogout,
}: UserDropdownProps) => {
  const { t } = useTranslation();
  const userInfo = useSelector((state: RootState) => state.user.userInfo);
  const [isPremium, setIsPremium] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo?.email) return;

    let timer: NodeJS.Timeout | null = null;
    
    const updateCountdown = async (premiumEnd: string) => {
      const now = new Date().getTime();
      const end = new Date(premiumEnd).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Premium Expired");
        setIsPremium(false);

        if (timer) clearInterval(timer);

        // 🔥 Move user instantly
        await fetch("/api/check-premium-expire", {
          method: "POST",
          body: JSON.stringify({ email: userInfo.email }),
        });

        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };

    const fetchPremium = async () => {
      const data: PremiumUser = await client.fetch(
        `*[_type == "premiumUser" && email == $email][0]`,
        { email: userInfo.email }
      );

      if (!data?.premiumEnd) {
        setIsPremium(false);
        return;
      }

      setIsPremium(true);
      updateCountdown(data.premiumEnd);

      timer = setInterval(() => {
        updateCountdown(data.premiumEnd!);
      }, 1000);
    };

    fetchPremium();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userInfo?.email]);

  return (
    <div
      className={`absolute top-full right-0 mt-2 ${
        userInfo ? "w-64" : "w-[200px]"
      } bg-white border border-gray-300 rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out ${
        isOpen
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      }`}
    >
      {userInfo?.email ? (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 ${
                  isPremium ? "bg-yellow-400" : "bg-blue-500"
                } rounded-full flex items-center justify-center`}
              >
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-gray-900 truncate">
                  {userName}
                </p>

                {isPremium && (
                  <div className="flex items-center space-x-1 bg-yellow-400 w-fit p-1 text-white rounded-2xl mt-1">
                    <MdOutlineWorkspacePremium />
                    <p className="text-xs font-medium truncate">
                      {t("premium")}
                    </p>
                  </div>
                )}

                <p className="text-[13px] text-gray-500 truncate mt-1">
                  {userEmail}
                </p>

                {timeLeft && (
                  <p className="text-[12px] text-gray-600 mt-1">
                    {t("expiresIn")}:{" "}
                    <span className="font-semibold">{timeLeft}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="py-2">
            {!isPremium && (
              <Link
                href="/upgrade"
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <GrUpgrade className="w-4 h-4 mr-3 text-gray-500" />
                <span>{t("admin.upgrade")}</span>
              </Link>
            )}

            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-3 text-gray-500" />
              <span>{t("admin.logout")}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="py-2 px-2 flex justify-center">
          <Link
            href="/signin"
            className="gap-x-3 w-full flex justify-center items-center px-4 py-2 text-sm text-black font-semibold hover:text-white rounded-lg hover:bg-blue-700"
          >
            <IoMdLogIn className="w-6 h-6" />
            <button>{t("login_admin.signIn")}</button>
          </Link>
        </div>
      )}
    </div>
  );
};





// "use client";
// import { RootState } from "@/redux/store";
// import { client } from "@/sanity/lib/client";
// import { User, LogOut } from "lucide-react";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { MdOutlineWorkspacePremium } from "react-icons/md";
// import { useSelector } from "react-redux";
// import { GrUpgrade } from "react-icons/gr";
// import { IoMdLogIn } from "react-icons/io";

// interface UserDropdownProps {
//   isOpen: boolean;
//   userName: string | null;
//   userEmail: string;
//   onLogout: () => void;
// }
// interface PremiumUser {
//   email: string;
//   premiumStart?: string;
//   premiumEnd?: string;
// }

// export const UserDropdown = ({
//   isOpen,
//   userName,
//   userEmail,
//   onLogout,
// }: UserDropdownProps) => {
//   const { t } = useTranslation();
//   const userInfo = useSelector((state: RootState) => state.user.userInfo);
//   const [isPremium, setIsPremium] = useState(false);
//   const [timeLeft, setTimeLeft] = useState<string | null>(null);

//   useEffect(() => {
//     const checkPremium = async () => {
//       if (!userInfo?.email) return;

//       try {
//         const query = `*[_type == "premiumUser" && email == $email][0]{ email, premiumStart, premiumEnd }`;
//         const premiumUser: PremiumUser | null = await client.fetch(query, {
//           email: userInfo.email,
//         });

//         if (premiumUser && premiumUser.premiumEnd) {
//           setIsPremium(true);
//           updateCountdown(premiumUser.premiumEnd);
//           startCountdown(premiumUser.premiumEnd);
//         } else {
//           setIsPremium(false);
//           setTimeLeft(null);
//         }
//       } catch (err) {
//         console.error("Failed to fetch premium user:", err);
//       }
//     };

//     const updateCountdown = (endDateStr: string) => {
//       const end = new Date(endDateStr).getTime();
//       const now = new Date().getTime();
//       const diff = end - now;

//       if (diff <= 0) {
//         setTimeLeft("Premium Expired");
//         return;
//       }

//       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//       const minutes = Math.floor((diff / (1000 * 60)) % 60);
//       const seconds = Math.floor((diff / 1000) % 60);

//       setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
//     };

//     let timer: NodeJS.Timeout | null = null;

//     const startCountdown = (endDateStr: string) => {
//       if (timer) clearInterval(timer);
//       timer = setInterval(() => updateCountdown(endDateStr), 1000);
//     };

//     checkPremium();

//     return () => {
//       if (timer) clearInterval(timer);
//     };
//   }, [userInfo?.email]);

//   return (
//     <div
//       className={`absolute top-full right-0 mt-2 ${userInfo ? "w-64" : "w-[200px]"} bg-white border border-gray-300 rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out ${
//         isOpen
//           ? "opacity-100 scale-100 translate-y-0"
//           : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
//       }`}
//     >
//       {userInfo?.email ? (
//         <>
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center space-x-3">
//               <div
//                 className={`w-10 h-10 ${isPremium ? "bg-yellow-400" : "bg-blue-500"} rounded-full flex items-center justify-center`}
//               >
//                 <User className="w-5 h-5 text-white" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-extrabold text-gray-900 truncate">
//                   {userName}
//                 </p>
//                 {isPremium && (
//                   <div className="flex items-center space-x-1 bg-yellow-400 w-fit p-1 text-white rounded-2xl mt-1">
//                     <MdOutlineWorkspacePremium />
//                     <p className="text-xs font-medium truncate">{t("premium")}</p>
//                   </div>
//                 )}
//                 <p className="text-[13px] text-gray-500 truncate mt-1">
//                   {userEmail}
//                 </p>
//                 {timeLeft && (
//                   <p className="text-[12px] text-gray-600 mt-1">
//                     {t("expiresIn")}:{" "}
//                     <span className="font-semibold">{timeLeft}</span>
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//           <div className="py-2">
//             {!isPremium && (
//               <Link
//                 href="/upgrade"
//                 className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
//               >
//                 <GrUpgrade className="w-4 h-4 mr-3 text-gray-500" />
//                 <span>{t("admin.upgrade")}</span>
//               </Link>
//             )}
//             <button
//               onClick={onLogout}
//               className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
//             >
//               <LogOut className="w-4 h-4 mr-3 text-gray-500" />
//               <span>{t("admin.logout")}</span>
//             </button>
//           </div>
//         </>
//       ) : (
//         // Show only Login button if email not present
//         <div className="py-2 px-2 flex justify-center ">
//           <Link href="/signin" className=" gap-x-3 w-full flex justify-center items-center px-4 py-2 text-sm  text-black font-semibold hover:text-white rounded-lg hover:bg-blue-700 transition-colors duration-150">
            
//             <IoMdLogIn className="w-6 h-6 " /> 
//           <button
  
//           >
//             {t("login_admin.signIn")}
//           </button>
//           </Link>
//         </div>
//       )}
//     </div>
//   );
// };
