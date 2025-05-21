<template>
  <div>
    <!-- 네비게이션 바 -->
    <nav class="navbar">
      <ul class="nav-menu">
        <li><NuxtLink to="/" @click="selectMenu('API')">API</NuxtLink></li>
        <li><NuxtLink to="/" @click="selectMenu('Fonts')">Fonts</NuxtLink></li>
        <li><NuxtLink to="/" @click="selectMenu('CSS Code')">CSS Code</NuxtLink></li>
        <li><NuxtLink to="/" @click="selectMenu('Free')">Free Board</NuxtLink></li>
      </ul>
    </nav>

    <!-- 페이지 콘텐츠 렌더링 -->
    <NuxtPage />
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  setup() {
    const currentMenu = ref('API');

    const selectMenu = (menu) => {
      if (menu !== 'Free') {
        currentMenu.value = menu;
      }
    };

    return {
      currentMenu,
      selectMenu,
    };
  },
  provide() {
    return {
      currentMenu: computed(() => this.currentMenu),
      setCurrentMenu: this.selectMenu,
    };
  },
};
</script>

<style scoped>
.navbar {
  font-family: 'Super Guardian', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background-color: #1d1d1d;
}
.nav-menu {
  list-style: none;
  display: flex;
  gap: 1rem;
}
.nav-menu li a {
  font-size: min(5vw, 24px);
  text-decoration: none;
  color: #40ed21;
}
</style>