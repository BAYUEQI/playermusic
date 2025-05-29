import axios from "axios";

switch (process.env.NODE_ENV) {
  case "production":
    axios.defaults.baseURL = import.meta.env.VITE_MUSIC_API;
    break;
  case "development":
    axios.defaults.baseURL = "/api";
    break;
  default:
    axios.defaults.baseURL = import.meta.env.VITE_MUSIC_API;
    break;
}

axios.defaults.timeout = 30000;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.withCredentials = true;

// 请求拦截
axios.interceptors.request.use(
  (request) => {
    const lyricAtlasApiUrl = import.meta.env.VITE_LYRIC_ATLAS_API_URL;
    const requestFullUrl = request.baseURL ? request.baseURL + request.url : request.url;

    // Ensure headers object exists
    request.headers = request.headers || {};

    if (lyricAtlasApiUrl && requestFullUrl && requestFullUrl.startsWith(lyricAtlasApiUrl)) {
      // For Lyric Atlas API:
      // 1. Disable credentials
      request.withCredentials = false;
      // 2. Remove the X-Requested-With header if it exists
      delete request.headers['X-Requested-With'];
      console.log('[Axios Interceptor] Lyric Atlas request - Removed X-Requested-With, set withCredentials=false');
    } else {
      // For other requests:
      // 1. Ensure default credentials setting (true)
      request.withCredentials = true;
      // 2. Ensure X-Requested-With header is present (Axios default might handle this, but explicit is safer)
      if (!request.headers['X-Requested-With']) {
          request.headers['X-Requested-With'] = 'XMLHttpRequest';
      }
      console.log('[Axios Interceptor] Other request - Ensured X-Requested-With, set withCredentials=true');
    }

    if (!request.hiddenBar && typeof $loadingBar !== "undefined")
      $loadingBar.start();
    return request;
  },
  (error) => {
    if (typeof $loadingBar !== "undefined") $loadingBar.error(); // Ensure loading bar handles error
    console.error("请求失败，请稍后重试");
    return Promise.reject(error);
  }
);

// 响应拦截
axios.interceptors.response.use(
  (response) => {
    if (typeof $loadingBar !== "undefined") $loadingBar.finish();
    return response.data;
  },
  (error) => {
    if (typeof $loadingBar !== "undefined") $loadingBar.error(); // Ensure loading bar handles error
    if (error.response) {
      const data = error.response.data;
      switch (error.response.status) {
        case 401:
          console.error(data.message ? data.message : "无权限访问");
          break;
        case 301:
          console.error(data.message ? data.message : "请求发生重定向");
          break;
        case 404:
          console.error(data.message ? data.message : "请求资源不存在");
          break;
        case 500:
          console.error(data.message ? data.message : "内部服务器错误");
          break;
        default:
          console.error(data.message ? data.message : "请求失败，请稍后重试");
          break;
      }
    } else {
      console.error("请求失败，请稍后重试");
    }
    return Promise.reject(error);
  }
);

export default axios; 