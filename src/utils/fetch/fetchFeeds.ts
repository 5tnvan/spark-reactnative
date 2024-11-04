"use server";

import { supabase } from "@/src/lib/supabase";

/**
 * FETCH: fetchFollowers()
 * DB: supabase
 * TABLE: "follows"
 **/

export const fetchFeedByCountry = async (country_id: any) => {
  const { data, error } = await supabase
    .from("3sec_random_view")
    .select(
      "id, video_url, thumbnail_url, playback_id, created_at, suppressed, country:country_id(name), profile:user_id(id, username, avatar_url)"
    )
    .eq("country_id", country_id)
    .limit(3)
    .neq('suppressed', true)

  return data;
};
