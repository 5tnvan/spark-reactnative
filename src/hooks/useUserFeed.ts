"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * useUserFeed HOOK
 * Use this to get feed of videos from any user
 **/
export const useUserFeed = (user_id: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<any>();
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  const refetch = () => {
    setTriggerRefetch((prev) => !prev);
  };

  const init = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("3sec")
      .select(
        "id, video_url, thumbnail_url, playback_id, created_at, country:country_id(id, name), profile:user_id(id, username, avatar_url), 3sec_views(view_count)"
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    setFeed(data);
    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, [triggerRefetch]);

  return { isLoading, feed, refetch };
};

/**
 * USEFEED HOOK
 * Use this to get feed of videos
 **/
export const useUserFeedByUsername = (username: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<any>();
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  const refetch = () => {
    setTriggerRefetch((prev) => !prev);
  };

  const init = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (data) {
      const { data: feed } = await supabase
        .from("3sec")
        .select(
          "id, video_url, thumbnail_url, playback_id, created_at, country:country_id(id, name), profile:user_id(id, username, avatar_url), 3sec_views(view_count)"
        )
        .eq("user_id", data.id)
        .order("created_at", { ascending: false });
      setFeed(feed);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, [triggerRefetch]);

  return { isLoading, feed, refetch };
};
