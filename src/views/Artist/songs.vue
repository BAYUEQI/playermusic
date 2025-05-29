<template>
  <div class="songs">
    <DataLists :listData="artistData" />
    <n-space justify="center" v-if="artistData[0]">
      <n-button
        class="more"
        size="large"
        strong
        secondary
        round
        @click="router.push(`/all-songs?id=${artistId}&page=1`)"
      >
        {{ $t("general.name.allSong") }}
      </n-button>
    </n-space>
  </div>
</template>

<script setup>
import { getArtistSongs } from "@/api/artist";
import { useRouter } from "vue-router";
import { getAlbum } from '@/api/album'
import { getSongTime } from "@/utils/timeTools";
import { ref, toRaw } from 'vue';
import DataLists from "@/components/DataList/DataLists.vue";
const router = useRouter();

// 歌手数据
const artistId = ref(router.currentRoute.value.query.id);
const artistData = ref([]);

// 获取歌手热门歌曲
const getArtistSongsData = (id) => {
  getArtistSongs(id).then((res) => {
    console.log(res);
    artistData.value = [];

    res.hotSongs.forEach((v, i) => {

      const songId = v.al.id
      const album = ref([])
      
      // 此处获取到的歌曲均无 album.picUrl 参数，需要手动获取整个 album 数据替换
      getAlbum(songId).then((res) => {
        res = res.album
        album.value.push({
          id: res.id,
          pic: res.pic,
          name: res.name,
          picUrl: res.picUrl,
          pic_str: res.picId_str
        });
        
        artistData.value.push({
          id: v.id,
          num: i + 1,
          name: v.name,
          artist: v.ar,
          album: toRaw(album.value.reverse())[0],
          alia: v.alia,
          time: getSongTime(v.dt),
          fee: v.fee,
          pc: v.pc ? v.pc : null,
          mv: v.mv ? v.mv : null,
        });
      })
      // console.log(artistData)
    });
  });
};

onMounted(() => {
  getArtistSongsData(artistId.value);
});

// 监听路由参数变化
watch(
  () => router.currentRoute.value,
  (val) => {
    artistId.value = val.query.id;
    if (val.name == "ar-songs") {
      getArtistSongsData(artistId.value);
    }
  }
);
</script>

<style lang="scss" scoped>
.songs {
  .more {
    margin-top: 40px;
    width: 140px;
    font-size: 16px;
    transition: all 0.3s;
    &:hover {
      background-color: var(--main-second-color);
      color: var(--main-color);
    }
    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
