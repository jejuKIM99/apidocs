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
    <button
      class="cart-toggle-btn"
      @click="toggleCart"
    >
      🛒 <!-- 필요하면 SVG 아이콘으로 교체 가능 -->
    </button>

    <!-- 2) 장바구니 슬라이드 패널 (showCart가 true일 때 나타남) -->
    <transition name="cart-slide">
      <div v-if="showCart" class="cart-panel">
        <!-- a) 닫기 버튼 -->
        <button class="cart-close-btn" @click="toggleCart">✕</button>

        <!-- b) 장바구니 아이템 리스트 -->
        <div class="cart-items-container">
          <div
            v-for="(item, index) in cartItems"
            :key="index"
            class="cart-item"
          >
            <!-- API 제목 또는 라이브러리 이름 -->
            <div class="cart-item-title">{{ item.title }}</div>
            <!-- 해당 npm 설치 명령어 -->
              <div
                class="cart-item-command"
                @click="copyCommand(item.npm_command)"
                style="cursor: pointer;"
              >
                {{ item.npm_command }}
              </div>
            <!-- 휴지통(삭제) 버튼: 우측 상단에 배치 -->
            <button
              class="cart-item-remove-btn"
              @click="removeLibrary(index)"
              title="이 항목 삭제"
            >
              🗑
            </button>
          </div>
          <!-- 장바구니가 비어 있을 때 안내 문구 -->
          <p v-if="cartItems.length === 0" class="cart-empty-msg">
            장바구니가 비어 있습니다.
          </p>
        </div>
      </div>
    </transition>
    <!-- 페이지 콘텐츠 렌더링 -->
    <NuxtPage />
    <transition name="copy-slide">
    <!-- showCopyModal이 true일 때만 렌더링 -->
      <div
        v-if="showCopyModal"
        class="copy-modal"
      >
        Copy!
      </div>
  </transition>
    <SpeedInsights />
  </div>

  <!-- 푸터 -->
  <footer class="footer">
    <p>&copy; 2025 Code-Jesus Project. All rights reserved.</p>
    <p>GitHub: <a href="https://github.com/jejuKIM99" target="_blank">jejuKIM99 GitHub</a></p>
  </footer>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  // 기존 setup() 그대로 유지
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

  // 기존 provide() 그대로 유지
  provide() {
    return {
      currentMenu: computed(() => this.currentMenu),
      setCurrentMenu: this.selectMenu,
      addLibrary: this.addLibrary, 
    };
  },

  // 1) data(): cartItems(장바구니 목록)과 showCart(패널 열림 여부) 상태 추가
  data() {
    return {
      cartItems: [],     // { title: String, npm_command: String } 객체를 담을 배열
      showCart: false,   // false면 패널 숨김, true면 패널 표시
      showCopyModal: false, 
    };
  },

  // 2) methods: 장바구니에 항목 추가/삭제/패널 토글 기능 구현
  methods: {
    // 자식 컴포넌트([id].vue)에서 this.$root.addLibrary(...) 호출
    addLibrary(item) {
      // 중복 추가를 방지하고 싶으면 아래 로직에 조건문 추가 가능
      this.cartItems.push(item);
    },
    // 인덱스를 받아 해당 항목을 제거
    removeLibrary(index) {
      this.cartItems.splice(index, 1);
    },
    // 장바구니 패널을 열고 닫는 토글 함수
    toggleCart() {
      this.showCart = !this.showCart;
    },
    copyCommand(npmCommand) {
      // 1) 클립보드 복사
      navigator.clipboard.writeText(npmCommand)
        .then(() => {
          // 2) 복사 성공 시 showCopyModal을 true로 변경 → 템플릿의 v-if로 모달이 뜸
          this.showCopyModal = true;
          // 3) 1초 후에 자동으로 false로 돌려서 모달 숨김
          setTimeout(() => {
            this.showCopyModal = false;
          }, 1000);
        })
        .catch((err) => {
          console.error('클립보드 복사 실패:', err);
        });
    },
  },
};
</script>


<style scoped>
.navbar {
  width: 100vw;
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

.footer {
  background-size: contain;
  background-position: center;
  background-image: url(./assets/css/cj2.png);
  text-align: center;
  padding: 1rem;
  background-color: #000;
  color: #40ed21;
  border-top: 1px solid #40ed21;
  margin-top: 2rem;
}

.footer a {
  color: #40ed21;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* -----------------------------------------
   전역 장바구니(Cart) 버튼 스타일
----------------------------------------- */
.cart-toggle-btn {
  position: fixed;
  bottom: 20px;      /* 하단에서 20px 위 */
  right: 20px;       /* 우측에서 20px 왼쪽 */
  background-color: #000;  /* 원하는 배경색 */
  color: #fff;             /* 버튼 텍스트/아이콘 색상 */
  border: solid 2px #2cdb43;
  border-radius: 50%;      /* 원형으로 만들기 */
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1000;           /* 다른 요소 위에 뜨도록 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* -----------------------------------------
   장바구니 패널 기본 스타일 (숨긴 상태로 시작)
----------------------------------------- */
.cart-panel {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 70vw;
  max-width: 300px;
  height: 100vw;           /* 가로 너비 */
  max-height: 400px;       /* 화면 높이의 70%까지 */
  background-color: #000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border: solid 2px #2cdb43;
  border-bottom: none;
  overflow-y: auto;       /* 내용이 많으면 스크롤 생김 */
  z-index: 1001;           /* 토글 버튼 아래에, 하지만 다른 콘텐츠 위에 */
  padding: 1rem;
}

.cart-panel::-webkit-scrollbar {
  width: 6px;
}

.cart-panel::-webkit-scrollbar-thumb {
  background-color: #2cdb43;
  border-radius: 8px;
  border: 4px solid #2cdb43;
}

.cart-panel::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

/* -----------------------------------------
   슬라이드 애니메이션: up/down
----------------------------------------- */
.cart-slide-enter-active,
.cart-slide-leave-active {
  transition: transform 0.3s ease-out;
}
.cart-slide-enter-from,
.cart-slide-leave-to {
  transform: translateY(100%);  /* 아래로 감추기 */
}
.cart-slide-enter-to,
.cart-slide-leave-from {
  transform: translateY(0);     /* 제 자리(보임) */
}

/* -----------------------------------------
   장바구니 내부 아이템 스타일
----------------------------------------- */
.cart-items-container {
  margin-top: 1rem;
}
.cart-item {
  position: relative;       /* 삭제 버튼을 절대 위치시킬 기준 */
  background-color: #141414;
  border: 1px solid #2cdb43;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.cart-item-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.cart-item-command {
  font-family: monospace;
  font-size: 0.8rem;
  color: #fff;
  background-color: #2d2d2d;
  word-break: break-all;
  margin-bottom: 0.5rem;
  padding: 10px;
  border-radius: 4px;
}
/* 우측 상단 휴지통(삭제) 버튼 */
.cart-item-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: rgb(255, 255, 255);
}
/* 장바구니가 비어 있을 때 문구 */
.cart-empty-msg {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 2rem;
}

/* -----------------------------------------
   장바구니 닫기(X) 버튼
----------------------------------------- */
.cart-close-btn {
  position: absolute;
  top: 0px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #fff;
}

/* ===========================================
   Copy 모달: 하단 중앙에 슬라이드 업/다운
=========================================== */
.copy-modal {
  position: fixed;
  bottom: 40px;            /* 화면 하단에서 20px 위 */
  left: 50%;               /* 화면 가로 중앙 */
  transform: translateX(-50%);
  background-color: #40ed21;  /* 어두운 배경 (원하는 색으로 변경 가능) */
  color: #000;             /* 글자 색상 */
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  /* 초기 상태(enter-from)에서 아래로 내려 있다가 올라오도록 transform만 건드리기 */
}

/* ===========================================
   copy-slide 트랜지션 정의
=========================================== */
.copy-slide-enter-active,
.copy-slide-leave-active {
  transition: all 0.3s ease-out;
}
.copy-slide-enter-from,
.copy-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%); /* 화면 밖으로 내려간 상태 */
}
.copy-slide-enter-to,
.copy-slide-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);   /* 화면 중앙(보이는 상태) */
}

</style>