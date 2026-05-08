import axios from "axios";
import Cookies from "js-cookie";
import { getAuthToken, setAuthToken, notifyTokenRefreshed } from "./authToken";

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Attach the Payload JWT on every request (cookie first, module store as fallback)
axiosClient.interceptors.request.use((config) => {
  const payloadToken = Cookies.get("paylaod-token") || getAuthToken();

  if (payloadToken) {
    config.headers["Authorization"] = `JWT ${payloadToken}`;
  }

  if (config.method === "get") {
    const url = config.url || "";
    const collectionsToSkip = [
      "user-wt-coins",
      "web-orders",
      "web-subscription",
      "web-cart",
      "website/", // custom /api/website/* routes don't use Payload's _status filter
    ];
    const shouldSkip = collectionsToSkip.some((c) => url.includes(c));

    if (url.includes("/api/") && !url.includes("_status") && !shouldSkip) {
      config.params = {
        ...config.params,
        "where[_status][equals]": "published",
      };
    }
  }

  return config;
});

// On 401: silently refresh the Payload JWT via its refresh-token endpoint and
// retry the original request. Concurrent 401s are queued to avoid multiple
// simultaneous refresh calls.
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushPending = (error: unknown, token?: string) => {
  pendingRequests.forEach((p) =>
    error ? p.reject(error) : p.resolve(token!)
  );
  pendingRequests = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Handle both 401 (cart/orders) and 403 (loyalty/coins) — Payload CMS
    // returns different status codes for expired tokens depending on the collection.
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !original._retry) {
      // Queue concurrent 401s while a refresh is already in flight
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          original.headers["Authorization"] = `JWT ${token}`;
          return axiosClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use plain axios (not axiosClient) to avoid triggering this interceptor again.
        // withCredentials sends the Payload httpOnly session cookie that the backend needs.
        const res = await axios.post(
          `${API_BASE_URL}/api/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Payload v2 returns `refreshedToken`; some builds return `token`
        const newToken: string | undefined =
          res.data?.refreshedToken || res.data?.token;
        if (!newToken) throw new Error("Empty refresh response");

        Cookies.set("paylaod-token", newToken, { expires: 7 });
        setAuthToken(newToken);

        // Notify CartContext so it can call NextAuth update() to persist the new
        // token in the session JWT — preventing the expired token from being
        // re-synced on the next NextAuth session poll.
        await notifyTokenRefreshed(newToken);

        original.headers["Authorization"] = `JWT ${newToken}`;
        flushPending(null, newToken);
        return axiosClient(original);
      } catch (refreshError) {
        // Refresh failed (session fully expired) — clear stale credentials
        Cookies.remove("paylaod-token");
        setAuthToken(null);
        flushPending(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
