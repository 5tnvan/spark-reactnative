"use client"; // Removed this line as it's not necessary in a React Native environment

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchUser } from "../utils/fetch/fetchUser";

/**
 * useFeed HOOK
 * Use this to get feed of videos
 **/
export const useFeed = () => {
  const range = 3;

  const [isLoading, setIsLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  const refetch = () => {
    setPage(0); // Reset page
    setFeed([]); // Reset feed
    setTriggerRefetch(prev => !prev); // Trigger refetch
  };

  const fetchMore = () => {
    setPage((prevPage) => prevPage + 1); // Increase page by 1
  };

  const fetchFeed = async () => {
    setIsLoading(true);

    const user = await fetchUser();

    const { data, error } = await supabase
      .from('3sec_random_view')
      .select('id, thumbnail_url, video_url, created_at, suppressed, country:country_id(id, name), profile:user_id(id, username, avatar_url), 3sec_tips(created_at, network, transaction_hash, amount, currency, comment, tipper:wallet_id(id, username, avatar_url)), 3sec_views(view_count), 3sec_fires(count), 3sec_comments(count)')
      .neq('suppressed', true)
      .limit(range)

      if (error) {
        console.error("useFeed Error fetching data:", error);
      } else {
        // Check if each post is liked by the user
        const likedPostsPromises = data.map(async (post: any) => {
          const { data: liked, error } = await supabase
            .from("3sec_fires")
            .select()
            .eq("user_id", user.user?.id)
            .eq("video_id", post.id)
            .single();

          return { ...post, liked: !!liked }; // Add a property 'liked' to each post indicating whether it's liked by the user
        });

        // Wait for all promises to resolve
        const masterData = await Promise.all(likedPostsPromises);

        setFeed(existingFeed => [...existingFeed, ...masterData]);
      }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, [page, triggerRefetch]);

  return { isLoading, feed, fetchMore, refetch };
};
