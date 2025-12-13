"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setUserInfo } from "@/redux/slice";

export const usePremiumSSE = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.user.userInfo);

  useEffect(() => {
    if (!userInfo?.email) {
      return;
    }


    const sse = new EventSource("/api/premium-sse");

    // sse.onopen = () => {
    //   console.log("[SSE] Connection opened for user:", userInfo.email);
    // };

    sse.onmessage = (event) => {
    

      try {
        const data = JSON.parse(event.data);
        if (data.email?.toLowerCase() === userInfo?.email?.toLowerCase() && data.expired) {

          // Update Redux once
          dispatch(setUserInfo({ ...userInfo, isPremium: false }));
        } 
        // else {
        //   console.log("[SSE] Message not relevant for this user:", userInfo.email);
        // }
      } catch (err) {
        console.error("[SSE] Parsing error:", err, "Data:", event.data);
      }
    };

    sse.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [userInfo?.email, dispatch]);
};
