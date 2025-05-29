<template>
  <LyricPlayer 
    ref="lyricPlayerRef" 
    :lyricLines="currentLyrics" 
    :currentTime="currentTime"
    :playing="playState"
    :alignAnchor="alignAnchor"
    :alignPosition="alignPosition" 
    :enableSpring="setting.showYrcAnimation"
    :enableScale="setting.showYrcAnimation" 
    :enableBlur="setting.lyricsBlur"
    :enableInterludeDots="true"
    :wordFadeWidth="0.5" 
    :linePosXSpringParams="setting.springParams.posX"
    :linePosYSpringParams="setting.springParams.posY" 
    :lineScaleSpringParams="setting.springParams.scale" 
    :style="lyricStyles"
    @line-click="handleLineClick" 
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { musicStore, settingStore, siteStore } from "../../store";
import { LyricPlayer, type LyricPlayerRef } from "@applemusic-like-lyrics/vue";
import { preprocessLyrics, getProcessedLyrics, type LyricLine } from "./processLyrics";

const lyricPlayerRef = ref<LyricPlayerRef>();
const site = siteStore();
const music = musicStore();
const setting = settingStore();
const fontSize = ref(setting.lyricsFontSize * 3);

const playState = ref(false);
const currentTime = ref(0);

watch(() => music.playState, (newState) => {
  playState.value = newState;
}, {immediate: true});

const emit = defineEmits<{
  'line-click': [e: { line: { getLine: () => { startTime: number } } }],
  lrcTextClick: [time: number]
}>();

// 计算当前播放时间
watch(() => music.persistData.playSongTime.currentTime, (newTime) => {
  currentTime.value = newTime * 1000;
});

// 计算对齐方式
const alignAnchor = computed(() => 
  setting.lyricsBlock === 'center' ? 'center' : 'top'
);

const alignPosition = computed(() => 
  setting.lyricsBlock === 'center' ? 0.5 : 0.2
);

// 计算歌词样式
const lyricStyles = computed(() => ({
  '--amll-lp-color': mainColor.value,
  '--amll-lp-font-size': `${fontSize.value}px`,
  '--amll-lp-height': setting.lyricLineHeight,
  '--amll-lp-word-spacing': '0em',
  'font-weight': setting.lyricFontWeight,
  'font-family': setting.lyricFont,
  'letter-spacing': setting.lyricLetterSpacing,
  'cursor': 'pointer',
  '--amll-lyric-view-color': mainColor.value,
  'user-select': 'none',
  '-webkit-tap-highlight-color': 'transparent'
}));

watch(() => setting.lyricsFontSize, (newSize) => {
  fontSize.value = newSize * 3;
  lyricPlayerRef.value?.lyricPlayer?.value?.update();
});

// 处理歌词点击
const handleLineClick = (e: { line: { getLine: () => { startTime: number } } }) => {
  const time = e.line.getLine().startTime;
  if (time != null) {
    emit("lrcTextClick", time / 1000);
    emit("line-click", e); // 同时发送原始事件，保持兼容性
  }
};

const mainColor = computed(() => {
  if (!setting.immersivePlayer) return "rgb(239, 239, 239)";
  return `rgb(${site.songPicColor})`;
});

// 在组件挂载时预处理歌词，提前缓存结果
onMounted(() => {
  // 如果有歌词数据，预处理并缓存结果
  if (music.songLyric) {
    lyricPlayerRef.value?.lyricPlayer?.value?.setCurrentTime(currentTime.value);
    music.playState == true ? lyricPlayerRef.value?.lyricPlayer?.value?.resume() : lyricPlayerRef.value?.lyricPlayer?.value?.pause();
    lyricPlayerRef.value?.lyricPlayer?.value?.calcLayout();
    lyricPlayerRef.value?.lyricPlayer?.value?.update();
    console.log("[LyricPlayer] 组件挂载时预处理歌词数据");
    try {
      preprocessLyrics(music.songLyric, { 
        showYrc: setting.showYrc,
        showRoma: setting.showRoma,
        showTransl: setting.showTransl
      });
    } catch (error) {
      console.error("[LyricPlayer] 预处理歌词失败", error);
    }
  }
});

// 获取当前歌词 - 优先使用预处理缓存
const currentLyrics = computed<LyricLine[]>(() => {
  const songLyric = music.songLyric || { lrcAMData: [], yrcAMData: [], hasTTML: false, ttml: [] };
  
  // 记录歌词数据来源信息
  if (!songLyric.lrcAMData?.length && !songLyric.yrcAMData?.length && !songLyric.ttml?.length) {
    console.log("[LyricPlayer] 未检测到有效歌词数据");
    return [];
  }
  
  // 使用优化后的函数获取歌词，优先使用缓存数据
  return getProcessedLyrics(songLyric, { 
    showYrc: setting.showYrc,
    showRoma: setting.showRoma,
    showTransl: setting.showTransl
  });
});

// 监听歌曲变化时预处理歌词
watch(() => music.songLyric, (newLyric) => {
  if (newLyric) {
    console.log("[LyricPlayer] 歌词数据变化，预处理新的歌词");
    try {
      preprocessLyrics(newLyric, { 
        showYrc: setting.showYrc,
        showRoma: setting.showRoma,
        showTransl: setting.showTransl
      });
    } catch (error) {
      console.error("[LyricPlayer] 预处理新歌词失败", error);
    }
  }
}, { deep: true });

watch(() => music.playState, (newState) => {
  if (newState) {
    lyricPlayerRef.value?.lyricPlayer?.value?.setCurrentTime(currentTime.value);
  }
}, { immediate: true });
</script>



