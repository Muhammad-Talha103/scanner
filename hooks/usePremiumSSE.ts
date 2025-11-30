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
      console.log("[SSE] No user email found, SSE not started.");
      return;
    }

    console.log("[SSE] Starting SSE connection for user:", userInfo.email);

    const sse = new EventSource("/api/premium-sse");

    sse.onopen = () => {
      console.log("[SSE] Connection opened for user:", userInfo.email);
    };

    sse.onmessage = (event) => {
      console.log("[SSE] Message received:", event.data);

      try {
        const data = JSON.parse(event.data);
        if (data.email?.toLowerCase() === userInfo?.email?.toLowerCase() && data.expired) {
          console.log("[SSE] Premium expired detected for user:", userInfo.email);

          // Update Redux once
          dispatch(setUserInfo({ ...userInfo, isPremium: false }));
          console.log("[SSE] Redux updated: isPremium set to false for", userInfo.email);
        } else {
          console.log("[SSE] Message not relevant for this user:", userInfo.email);
        }
      } catch (err) {
        console.error("[SSE] Parsing error:", err, "Data:", event.data);
      }
    };

    sse.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
      sse.close();
      console.log("[SSE] Connection closed due to error for user:", userInfo.email);
    };

    return () => {
      sse.close();
      console.log("[SSE] Connection manually closed for user:", userInfo.email);
    };
  }, [userInfo?.email, dispatch]);
};
