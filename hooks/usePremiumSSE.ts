"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setUserInfo } from "@/redux/slice";

export const usePremiumSSE = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.user.userInfo);

  useEffect(() => {
    if (!userInfo?.email) return;

    const sse = new EventSource("/api/premium-sse");

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.email.toLowerCase() === userInfo?.email?.toLowerCase() && data.expired) {
          // Update Redux once
          dispatch(setUserInfo({ ...userInfo, isPremium: false }));
          console.log("[SSE] Premium expired:", userInfo.email);
        }
      } catch (err) {
        console.error("SSE parsing error:", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE connection error:", err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [userInfo?.email, dispatch]);
};
