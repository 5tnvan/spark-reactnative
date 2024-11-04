"use client";

import { useEffect, useState } from "react";
import { fetchRandomLocation } from "../utils/fetch/fetchLocations";
import { fetchFeedByCountry } from "../utils/fetch/fetchFeeds";

/**
 * useFeedFromCountry HOOK
 * Use this to get feed of videos from a location (country)
 **/
export const useFeedFromCountry = (times: number) => {
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<any[]>([]);
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  const refetch = () => {
    setTriggerRefetch((prev) => !prev);
  };

  const init = async () => {
    setIsLoading(true);
    const feeds: any[] = [];

    for (let i = 0; i < times; i++) {
      const loc = await fetchRandomLocation();
      if (loc) {
        const feed = await fetchFeedByCountry(loc?.country_id);
        if (feed && feed.length > 0) {
          feeds.push({
            id: (i + 1).toString(),
            data: feed,
            first_video_url: feed[0].video_url,
            first_video_playback_id: feed[0].playback_id,
            country_name: feed[0].country.name
          });
        }
      }
    }

    setFeed(feeds);
    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, [triggerRefetch]);

  return { isLoading, feed, refetch };
};
