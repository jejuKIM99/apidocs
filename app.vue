<template>
  <div>
    <!-- 네비게이션 바 -->
    <nav class="navbar">
      <ul class="nav-menu">
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('API')"
            :class="{ 'active': currentMenu === 'API' }"
          >API</NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('Fonts')"
            :class="{ 'active': currentMenu === 'Fonts' }"
          >Fonts</NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('CSS Code')"
            :class="{ 'active': currentMenu === 'CSS Code' }"
          >CSS Code</NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- 페이지 콘텐츠 렌더링 -->
    <NuxtPage />
    <SpeedInsights />
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  setup() {
    const currentMenu = ref('API');

    const selectMenu = (menu) => {
      currentMenu.value = menu;
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
  background-color: #000;
}
.nav-menu {
  list-style: none;
  display: flex;
  gap: 1rem;
}
.nav-menu li a {
  font-size: min(5vw, 24px);
  text-decoration: none;
  color: white; /* 기본 색상: 흰색 */
}
.nav-menu li a.active {
  color: #40ed21; /* 선택된 메뉴 색상: 초록색 */
}
</style>