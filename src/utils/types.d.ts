declare module '@/utils/getLanguageData' {
  const getLanguageData: (key: string) => string;
  export default getLanguageData;
}

declare module '@/utils/timeTools' {
  export function formatNumber(num: number): string;
  export function getLongTime(time: number): string;
  export function getSongTime(time: number): string;
  export function getSongPlayingTime(time: number): string;
}

declare module '@/api/user' {
  export function userLogOut(): Promise<any>;
  export function getUserLevel(): Promise<any>;
  export function getUserSubcount(): Promise<any>;
  export function getUserPlaylist(userId: number, limit?: number): Promise<any>;
  export function getUserArtistlist(): Promise<any>;
  export function getUserAlbum(limit?: number, offset?: number): Promise<any>;
  export function getLikelist(uid: number): Promise<any>;
  export function setLikeSong(id: number, like?: boolean): Promise<any>;
} 