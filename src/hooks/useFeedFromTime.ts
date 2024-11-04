"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any) => {
  let shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

/**
 * useFeedFromTime HOOK
 * Use this to get feed of videos from a particular time (24hrs, 48hrs, a week ago)
 **/
export const useFeedFromTime = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<any[]>([]);
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  const refetch = () => {
    setTriggerRefetch(prev => !prev);
  };

  const fetchFeed = async (startTime: Date, endTime: Date) => {
    const { data, error } = await supabase
      .from('3sec_random_view')
      .select('id, video_url, thumbnail_url, playback_id, created_at, suppressed, country:country_id(name), profile:user_id(id, username, avatar_url)')
      .gte('created_at', endTime.toISOString())
      .lt('created_at', startTime.toISOString())
      .limit(3)
      .neq('suppressed', true)

    if (error) {
      console.error("useFeedFromTime Error fetching data:", error);
    }
    return data || [];
  };

  const init = async () => {
    setIsLoading(true);

    const now = new Date();
    const startOf24HoursAgo = new Date(now);
    startOf24HoursAgo.setHours(startOf24HoursAgo.getHours() - 24);

    const endOf48HoursAgo = new Date(startOf24HoursAgo);
    const startOf48HoursAgo = new Date(now);
    startOf48HoursAgo.setHours(startOf48HoursAgo.getHours() - 48);

    const startOfWeekAgo = new Date(now);
    startOfWeekAgo.setHours(startOfWeekAgo.getHours() - 168);

    let feed24 = await fetchFeed(now, startOf24HoursAgo);
    let feed48 = await fetchFeed(startOf24HoursAgo, startOf48HoursAgo);
    let feedWeek = await fetchFeed(startOf48HoursAgo, startOfWeekAgo);

    const combinedFeeds = [];

    // Shuffle the feeds before combining
    feed24 = shuffleArray(feed24);
    feed48 = shuffleArray(feed48);
    feedWeek = shuffleArray(feedWeek);

    if (feed24 && feed24.length > 0) {
      combinedFeeds.push({ id: '1', data: feed24, first_video: feed24[0], time: '24hrs' });
    }

    if (feed48 && feed48.length > 0) {
      combinedFeeds.push({ id: '2', data: feed48, first_video: feed48[0], time: 'yesterday' });
    }

    if (feedWeek && feedWeek.length > 0) {
      combinedFeeds.push({ id: '3', data: feedWeek, first_video: feedWeek[0], time: 'a week ago' });
    }

    setFeed(combinedFeeds);
    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, [triggerRefetch]);

  return { isLoading, feed, refetch };
};
