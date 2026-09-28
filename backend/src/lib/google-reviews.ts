export type GoogleReview = {
  name: string;
  text: string;
  rating: number;
  timeAgo: string;
  photoUrl?: string;
};

export type GoogleReviewsPayload = {
  rating: number;
  total: number;
  url?: string;
  reviews: GoogleReview[];
  source: "google" | "fallback";
};

const FALLBACK: GoogleReviewsPayload = {
  rating: 4.8,
  total: 0,
  reviews: [],
  source: "fallback",
};

let cache: { key: string; at: number; data: GoogleReviewsPayload | null } = {
  key: "",
  at: 0,
  data: null,
};

const CACHE_MS = 60 * 60 * 1000;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export async function fetchGoogleReviews(placeId: string | null | undefined): Promise<GoogleReviewsPayload | null> {
  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || "").trim();
  const pid = (placeId || "").trim();
  if (!apiKey || !pid) return null;

  const cacheKey = `${pid}:${apiKey.slice(-6)}`;
  if (cache.data && cache.key === cacheKey && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(pid)}` +
    `&fields=reviews,rating,user_ratings_total,url` +
    `&reviews_sort=newest` +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    const json = (await res.json()) as {
      status?: string;
      result?: {
        rating?: number;
        user_ratings_total?: number;
        url?: string;
        reviews?: {
          author_name?: string;
          rating?: number;
          text?: string;
          relative_time_description?: string;
          profile_photo_url?: string;
        }[];
      };
    };

    if (json.status !== "OK" || !json.result) {
      console.warn("[google-reviews]", json.status || "unknown error");
      return null;
    }

    const reviews = (json.result.reviews || [])
      .filter((r) => r.text?.trim())
      .slice(0, 6)
      .map((r) => ({
        name: r.author_name || "Google user",
        text: r.text!.trim(),
        rating: Number(r.rating) || 5,
        timeAgo: r.relative_time_description || "",
        photoUrl: r.profile_photo_url || undefined,
      }));

    if (!reviews.length) return null;

    const payload: GoogleReviewsPayload = {
      rating: Number(json.result.rating) || 5,
      total: Number(json.result.user_ratings_total) || reviews.length,
      url: json.result.url,
      reviews,
      source: "google",
    };

    cache = { key: cacheKey, at: Date.now(), data: payload };
    return payload;
  } catch (err) {
    console.warn("[google-reviews] fetch failed", err);
    return null;
  }
}

export { initials as reviewInitials, FALLBACK as fallbackReviews };
