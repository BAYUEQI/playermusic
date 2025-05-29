import { toRaw } from 'vue';
import type { ComputedRef } from 'vue';
import type { Store } from 'pinia';

/**
 * 歌词单词接口
 */
export interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
  // rawWord?: InputLyricWord; // 可选，用于调试
}

/**
 * 歌词行接口
 */
export interface LyricLine {
  startTime: number;
  endTime: number;
  words: LyricWord[];
  translatedLyric: string;
  romanLyric: string;
  isBG: boolean;
  isDuet: boolean;
}

/**
 * 歌词数据接口
 */
export interface LyricData {
  lyric: string;
}

/**
 * 歌词元数据接口
 */
export interface LyricMeta {
  found: boolean;
  id: string;
  availableFormats?: string[]; // 如 ["yrc", "eslrc", "lrc", "ttml"]
  hasTranslation?: boolean;
  hasRomaji?: boolean;
}

/**
 * 歌曲歌词接口
 */
export interface SongLyric {
  lrcAMData: LyricLine[];
  yrcAMData: LyricLine[];
  hasTTML?: boolean;    // 是否拥有TTML格式歌词
  ttml?: LyricLine[];   // TTML解析后的数据
  tlyric?: { lyric: string }; // LAAPI 提供的翻译歌词对象
  romalrc?: { lyric: string }; // LAAPI 提供的音译歌词对象
  // 兼容新版LAAPI格式
  translation?: string | { lyric: string }; // 新版LAAPI 提供的翻译歌词 (LRC格式)
  romaji?: string | { lyric: string };      // 新版LAAPI 提供的音译歌词 (LRC格式)
  // 添加预处理后的缓存
  processedLyrics?: LyricLine[];
  // 处理设置的哈希值，用于检测设置是否变更
  settingsHash?: string;
  // 添加元数据信息
  meta?: LyricMeta;
}

/**
 * 设置状态接口
 */
export interface SettingState {
  showYrc: boolean;
  showRoma: boolean;
  showTransl: boolean;
}

/**
 * 生成设置状态的哈希值，用于判断设置是否变更
 * @param settings 设置状态
 * @returns 设置状态的哈希值
 */
function generateSettingsHash(settings: SettingState): string {
  return `${settings.showYrc}-${settings.showRoma}-${settings.showTransl}`;
}

/**
 * 转换LRC格式文本为时间映射
 * @param lrcText LRC格式文本
 * @returns 时间到文本的映射
 */
function parseLrcToTimeMap(lrcText: string): Map<number, string> {
  const timeMap = new Map<number, string>();
  if (!lrcText) return timeMap;
  
  const lines = lrcText.split('\n');
  lines.forEach(line => {
    const match = line.match(/^\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const timeMs = min * 60000 + sec * 1000 + ms * 10; // LRC时间格式转毫秒
      const text = match[4].trim();
      if (text) {
        timeMap.set(timeMs, text);
      }
    }
  });
  
  return timeMap;
}

/**
 * 查找最接近的时间戳匹配
 * @param targetTime 目标时间
 * @param timeMap 时间映射
 * @param tolerance 容差范围
 * @returns 匹配的文本
 */
function findBestTimeMatch(targetTime: number, timeMap: Map<number, string>, tolerance: number = 5000): string {
  // 首先尝试精确匹配
  if (timeMap.has(targetTime)) {
    return timeMap.get(targetTime) || "";
  }
  
  // 查找时间差最小的匹配
  let closestMatch = "";
  let minDiff = tolerance;
  
  for (const [time, text] of timeMap.entries()) {
    const diff = Math.abs(time - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestMatch = text;
    }
  }
  
  return closestMatch;
}

/**
 * 预处理和缓存歌词数据，在获取歌词时提前处理以提高性能
 * @param songLyric 歌曲歌词
 * @param settings 设置状态
 */
export function preprocessLyrics(songLyric: SongLyric, settings: SettingState): void {
  // 生成当前设置的哈希值
  const currentHash = generateSettingsHash(settings);
  
  // 如果已经预处理过且设置没变，直接返回
  if (songLyric.processedLyrics && 
      songLyric.processedLyrics.length > 0 &&
      songLyric.settingsHash === currentHash) {
    console.log('[preprocessLyrics] 使用缓存的预处理歌词数据');
    return;
  }
  
  console.log('[preprocessLyrics] 开始预处理歌词数据');
  const startTime = performance.now();
  
  // 缓存处理后的歌词结果
  songLyric.processedLyrics = createLyricsProcessor(songLyric, settings);
  // 保存设置哈希值，用于检测设置是否变更
  songLyric.settingsHash = currentHash;
  
  const endTime = performance.now();
  console.log(`[preprocessLyrics] 预处理完成，耗时: ${(endTime - startTime).toFixed(2)}ms，行数: ${songLyric.processedLyrics.length}`);
}

/**
 * 处理歌词数据
 * @param songLyric 歌曲歌词
 * @param settings 设置状态
 * @returns 处理后的歌词行数组
 */
export function createLyricsProcessor(songLyric: SongLyric, settings: SettingState): LyricLine[] {
  // 优先级顺序：TTML > YRC > LRC
  let rawLyricsSource: InputLyricLine[] = []; // Use InputLyricLine for the source type

  // 选择合适的歌词源
  if (songLyric.hasTTML && songLyric.ttml && songLyric.ttml.length > 0) {
    console.log('[createLyricsProcessor] 使用TTML格式歌词');
    rawLyricsSource = toRaw(songLyric.ttml) as InputLyricLine[];
  }
  else if (settings.showYrc && songLyric.yrcAMData?.length) {
    console.log('[createLyricsProcessor] 使用YRC格式歌词');
    rawLyricsSource = toRaw(songLyric.yrcAMData) as InputLyricLine[];
  }
  else if (songLyric.lrcAMData?.length) { // Ensure lrcAMData exists before using it
    console.log('[createLyricsProcessor] 使用LRC格式歌词');
    rawLyricsSource = toRaw(songLyric.lrcAMData) as InputLyricLine[];
  } else {
    console.log('[createLyricsProcessor] 没有有效的歌词源数据');
    return []; // No data to process
  }

  // 预解析LRC格式的翻译和音译到时间映射表
  let translationMap: Map<number, string> = new Map();
  if (settings.showTransl) {
    let translationSourceText: string | undefined;
    if (songLyric.tlyric?.lyric) translationSourceText = songLyric.tlyric.lyric;
    else if (typeof songLyric.translation === 'string') translationSourceText = songLyric.translation;
    else if (typeof songLyric.translation === 'object' && songLyric.translation?.lyric) translationSourceText = songLyric.translation.lyric;
    if (translationSourceText) {
      translationMap = parseLrcToTimeMap(translationSourceText);
      // console.log(`[createLyricsProcessor] 解析翻译歌词完成，共${translationMap.size}行`);
    }
  }

  let romajiMap: Map<number, string> = new Map();
  if (settings.showRoma) {
    let romajiSourceText: string | undefined;
    if (songLyric.romalrc?.lyric) romajiSourceText = songLyric.romalrc.lyric;
    else if (typeof songLyric.romaji === 'string') romajiSourceText = songLyric.romaji;
    else if (typeof songLyric.romaji === 'object' && songLyric.romaji?.lyric) romajiSourceText = songLyric.romaji.lyric;
    if (romajiSourceText) {
      romajiMap = parseLrcToTimeMap(romajiSourceText);
      // console.log(`[createLyricsProcessor] 解析音译歌词完成，共${romajiMap.size}行`);
    }
  }

  // 单遍处理所有歌词行
  return rawLyricsSource.map((rawLineData: InputLyricLine, lineIndex: number): LyricLine => {
    const rawLine = toRaw(rawLineData); // Ensure we are working with the raw object
    
    const processedWords = processWords(rawLine.words || []);

    // 确定行开始和结束时间，优先使用行级别的时间戳
    let lineStartTime: number = rawLine.startTime ?? (processedWords.length > 0 ? processedWords[0].startTime : 0);
    let lineEndTime: number = rawLine.endTime ?? 
                           (processedWords.length > 0 ? 
                            processedWords[processedWords.length - 1].endTime : 
                            lineStartTime); // Fallback to startTime if no words
    
    // 确保 endTime 不早于 startTime
    if (lineEndTime < lineStartTime && processedWords.length > 0) {
        lineEndTime = Math.max(processedWords[processedWords.length - 1].endTime, lineStartTime);
    }
     if (lineEndTime < lineStartTime) { // Final fallback if still inconsistent
        lineEndTime = lineStartTime;
    }

    let translatedLyric = rawLine.translatedLyric || "";
    let romanLyric = rawLine.romanLyric || "";

    // 如果行本身没有预填充翻译/音译 (例如来自TTML的特定翻译轨道)，则尝试从LRC格式的翻译/音译数据中查找
    if (settings.showTransl && !translatedLyric && translationMap.size > 0) {
      translatedLyric = findBestTimeMatch(lineStartTime, translationMap);
    }
    if (settings.showRoma && !romanLyric && romajiMap.size > 0) {
      romanLyric = findBestTimeMatch(lineStartTime, romajiMap);
    }

    return {
      startTime: lineStartTime,
      endTime: lineEndTime,
      words: processedWords,
      translatedLyric,
      romanLyric,
      isBG: rawLine.isBG ?? false,
      isDuet: rawLine.isDuet ?? false,
    };
  });
}

/**
 * 处理原始单词数组，确保空格等特殊单词被正确处理。
 * @param words 原始单词数组 (来自解析库)
 * @returns 处理后的单词数组 (用于 LyricPlayer)
 */
function processWords(words: InputLyricWord[]): LyricWord[] {
  if (!words || words.length === 0) {
    return [];
  }
  // 直接映射，假设解析库提供的单词已包含正确的空格表示
  // (例如，TTML解析器应将空格处理为单独的word对象，如 {"startTime":0,"endTime":0,"word":" "})
  return words.map(w => ({
    word: w.word,
    startTime: w.startTime,
    endTime: w.endTime,
    // rawWord: w // 调试时可以取消注释
  }));
}

/**
 * 获取处理后的歌词行，优先使用缓存
 * @param songLyric 歌曲歌词
 * @param settings 设置状态
 * @returns 处理后的歌词行数组
 */
export function getProcessedLyrics(songLyric: SongLyric, settings: SettingState): LyricLine[] {
  // 生成当前设置的哈希值
  const currentHash = generateSettingsHash(settings);
  
  // 如果有缓存且设置未变，直接返回缓存
  if (songLyric.processedLyrics && 
      songLyric.processedLyrics.length > 0 && 
      songLyric.settingsHash === currentHash) {
    console.log('[getProcessedLyrics] 使用缓存的歌词数据');
    return songLyric.processedLyrics;
  }
  
  // 否则，重新处理并更新缓存
  console.log('[getProcessedLyrics] 缓存未命中，重新处理歌词');
  songLyric.processedLyrics = createLyricsProcessor(songLyric, settings);
  songLyric.settingsHash = currentHash;
  
  return songLyric.processedLyrics;
}

//确保 InputLyricLine 和 InputLyricWord 类型定义与 @applemusic-like-lyrics/lyric 库的导出一致
//假设它们是这样的：
interface InputLyricWord {
  word: string;
  startTime: number;
  endTime: number;
  [key: string]: any; // 其他可能的属性
}

interface InputLyricLine {
  words: InputLyricWord[];
  startTime?: number; // 行的开始时间 (毫秒)
  endTime?: number;   // 行的结束时间 (毫秒)
  translatedLyric?: string; // 可能已预填充
  romanLyric?: string;    // 可能已预填充
  isBG?: boolean;
  isDuet?: boolean;
  [key: string]: any; // 其他可能的属性
}