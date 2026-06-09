"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { trackPageView, trackLogin, trackSignup } from "@/lib/supabase";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const prevPathRef = useRef<string>("");

  // 1. Track Page Views
  useEffect(() => {
    if (!pathname) return;
    
    // Combine path + search params for complete path
    const searchString = searchParams?.toString();
    const fullPath = searchString ? `${pathname}?${searchString}` : pathname;
    
    if (prevPathRef.current !== fullPath) {
      prevPathRef.current = fullPath;
      trackPageView(fullPath, user?.id || null);
    }
  }, [pathname, searchParams, user?.id]);

  // 2. Track Auth Events (Login / Signup)
  useEffect(() => {
    if (!isLoaded || !user) return;

    const userId = user.id;
    const email = user.primaryEmailAddress?.emailAddress || "unknown@user.com";
    const userCreatedAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
    const isNewUser = Date.now() - userCreatedAt < 60000; // registered in the last minute

    // Try tracking signup first if new user
    if (isNewUser) {
      const signupTrackedKey = `tracked_signup_${userId}`;
      if (!localStorage.getItem(signupTrackedKey)) {
        localStorage.setItem(signupTrackedKey, "true");
        trackSignup(userId, email);
      }
    }

    // Track login session-based
    const loginTrackedKey = `tracked_login_${userId}`;
    if (!sessionStorage.getItem(loginTrackedKey)) {
      sessionStorage.setItem(loginTrackedKey, "true");
      trackLogin(userId, email);
    }
  }, [user, isLoaded]);

  return null;
}
