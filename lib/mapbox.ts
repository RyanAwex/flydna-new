export const mapboxTransformRequest = (url: string) => {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    if (url.startsWith("https://api.mapbox.com")) {
      return {
        url: url.replace("https://api.mapbox.com", `${window.location.origin}/api/mapbox-proxy`),
      };
    }
  }
  return { url };
};
