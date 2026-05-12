export const TIKHUB_ENDPOINTS = {
  douyinHotTopics: "/api/v1/douyin/index/fetch_current_hot_topic",
  douyinHotSearch: "/api/v1/douyin/app/v3/fetch_hot_search_list",
  douyinCreatorHotSpot: "/api/v1/douyin/creator/fetch_creator_hot_spot_billboard",
  douyinSearchVideos: "/api/v1/douyin/search/fetch_video_search_result",
  xiaohongshuSearchNotes: "/api/v1/xiaohongshu/web_v3/fetch_search_notes",
  xiaohongshuNoteComments: "/api/v1/xiaohongshu/app_v2/get_note_comments",
  weiboHotSearch: "/api/v1/weibo/web_v2/fetch_hot_search",
  bilibiliSearchVideos: "/api/v1/bilibili/web/search",
} as const;

export type TikHubEndpointKey = keyof typeof TIKHUB_ENDPOINTS;
