<template>
  <div ref="wrapperRef" v-bind="$attrs"></div>
</template>

<script setup lang="ts">
// Thanks to Steven-xmh's `applemusic-like-lyrics` package.
import {
  BackgroundRender as CoreBackgroundRender,
  AbstractBaseRenderer,
  BaseRenderer,
  MeshGradientRenderer,
} from "@applemusic-like-lyrics/core";
import { ref, onMounted, onUnmounted, watch, defineExpose } from "vue";

interface BackgroundRenderProps {
  album?: string;
  fps?: number;
  playing?: boolean;
  flowSpeed?: number;
  hasLyric?: boolean;
  lowFreqVolume?: number;
  renderScale?: number;
  staticMode?: boolean;
  renderer?: { new(canvas: HTMLCanvasElement): BaseRenderer };
}

const props = withDefaults(defineProps<BackgroundRenderProps>(), {
  playing: true,
  hasLyric: true,
  lowFreqVolume: 1.0,
  renderScale: 0.5,
  staticMode: false,
});

const coreBGRenderRef = ref<AbstractBaseRenderer>();
const wrapperRef = ref<HTMLDivElement | null>(null);
const isRendered = ref(false);

// 强制渲染函数
const forceRender = () => {
  if (!coreBGRenderRef.value) return;
  
  // 记住原始播放状态
  const originalPlayingState = props.playing;
  
  // 强制启动渲染器
  coreBGRenderRef.value.resume();
  
  // 使用多个连续的动画帧确保渲染完成
  const renderFrames = (count: number) => {
    if (count <= 0) {
      // 完成渲染后，如果原始状态是暂停，则恢复暂停
      if (!originalPlayingState) {
        coreBGRenderRef.value?.pause();
      }
      isRendered.value = true;
      return;
    }
    
    requestAnimationFrame(() => renderFrames(count - 1));
  };
  
  renderFrames(3); // 尝试渲染3帧以确保效果显示
};

onMounted(() => {
  coreBGRenderRef.value = CoreBackgroundRender.new(props.renderer ?? MeshGradientRenderer);
  if (props.album) coreBGRenderRef.value?.setAlbum(props.album);
  if (props.fps) coreBGRenderRef.value?.setFPS(props.fps);
  if (props.flowSpeed) coreBGRenderRef.value?.setFlowSpeed(props.flowSpeed);
  coreBGRenderRef.value?.setStaticMode(props.staticMode);
  coreBGRenderRef.value?.setRenderScale(props.renderScale);
  coreBGRenderRef.value?.setLowFreqVolume(props.lowFreqVolume);
  coreBGRenderRef.value?.setHasLyric(props.hasLyric);

  if (coreBGRenderRef.value) {
    const el = coreBGRenderRef.value.getElement();
    el.style.width = "100%";
    el.style.height = "100%";
    wrapperRef.value?.appendChild(el);
    
    // 等待DOM渲染完成后强制显示背景
    setTimeout(() => {
      if (!isRendered.value) {
        forceRender();
      }
    }, 100);
    
    // 如果第一次尝试失败，再尝试一次
    setTimeout(() => {
      if (!isRendered.value) {
        forceRender();
      }
    }, 500);
  }
  
  // 根据props.playing设置初始状态
  if (props.playing) {
    coreBGRenderRef.value?.resume();
  } else {
    coreBGRenderRef.value?.pause();
  }
});

onUnmounted(() => {
  coreBGRenderRef.value?.dispose();
});

watch(() => props.album, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setAlbum(newValue);
});

watch(() => props.fps, (newValue) => {
  if (typeof newValue !== 'undefined') coreBGRenderRef.value?.setFPS(newValue);
});

watch(() => props.playing, (newValue) => {
  if (newValue) {
    coreBGRenderRef.value?.resume();
  } else {
    coreBGRenderRef.value?.pause();
  }
});

watch(() => props.flowSpeed, (newValue) => {
  if (typeof newValue !== 'undefined') coreBGRenderRef.value?.setFlowSpeed(newValue);
});

watch(() => props.staticMode, (newValue) => {
  coreBGRenderRef.value?.setStaticMode(newValue);
});

watch(() => props.renderScale, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setRenderScale(newValue);
});

watch(() => props.lowFreqVolume, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setLowFreqVolume(newValue);
});

watch(() => props.hasLyric, (newValue) => {
  if (newValue !== undefined) coreBGRenderRef.value?.setHasLyric(newValue);
});

defineExpose({
  wrapperEl: wrapperRef,
  bgRender: coreBGRenderRef,
  forceRender
});
</script>
