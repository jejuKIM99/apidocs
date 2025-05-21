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
    <!-- 로그인/로그아웃 버튼 -->
    <button class="login-btn" @click="toggleAuthModal">
      {{ user ? '로그아웃' : '로그인' }}
    </button>
    <!-- 글쓰기 버튼 (로그인 시 표시) -->
    <button v-if="user" class="write-btn" @click="writePost">글쓰기</button>

    <!-- 인증 모달 -->
    <div v-if="showAuthModal" class="modal-overlay" @click.self="closeAuthModal">
      <div class="modal-content">
        <button class="close-btn" @click="closeAuthModal">×</button>
        <div class="auth-form">
          <h2>{{ isLoginForm ? '로그인' : '회원가입' }}</h2>
          <button class="github-btn" @click="authWithGitHub">
            <svg class="github-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub로 {{ isLoginForm ? '로그인' : '회원가입' }}
          </button>
          <p>
            {{ isLoginForm ? '계정이 없으신가요?' : '이미 계정이 있으신가요?' }}
            <span class="toggle-form" @click="isLoginForm = !isLoginForm">
              {{ isLoginForm ? '회원가입' : '로그인' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- 페이지 콘텐츠 렌더링 -->
    <NuxtPage />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useNuxtApp, useRouter } from '#app';

export default {
  setup() {
    const { $supabase } = useNuxtApp();
    const supabase = $supabase;
    const router = useRouter();

    const currentMenu = ref('API');
    const showAuthModal = ref(false);
    const isLoginForm = ref(true);
    const user = ref(null);

    const selectMenu = (menu) => {
      if (menu !== 'Free') {
        currentMenu.value = menu;
      }
    };

      const toggleAuthModal = async () => {
        if (user.value) {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('로그아웃 오류:', error.message);
              alert('로그아웃 실패: ' + error.message);
            } else {
              user.value = null; // 사용자 상태 즉시 초기화
              closeAuthModal();
              await initializeSession(); // 세션 갱신
              console.log('로그아웃 성공');
            }
          } catch (err) {
            console.error('로그아웃 중 예기치 않은 오류:', err);
            alert('로그아웃 중 오류가 발생했습니다.');
          }
        } else {
          showAuthModal.value = true;
        }
      };
    const closeAuthModal = () => {
      showAuthModal.value = false;
    };

    const authWithGitHub = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: window.location.origin },
        });
        if (error) {
          console.error('GitHub 인증 오류:', error);
          alert('GitHub 인증 실패: ' + error.message);
        }
      } catch (err) {
        console.error('인증 중 예기치 않은 오류:', err);
        alert('인증 중 오류가 발생했습니다.');
      }
    };

    const writePost = () => {
      router.push('/write');
    };

      const initializeSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('세션 초기화 오류:', error);
            user.value = null; // 오류 발생 시 사용자 상태 초기화
          } else {
            user.value = session?.user ?? null;
            console.log('현재 사용자:', user.value);
          }
        } catch (err) {
          console.error('세션 초기화 중 예기치 않은 오류:', err);
          user.value = null; // 예외 발생 시 사용자 상태 초기화
        }
      };
    initializeSession();

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경:', event, session?.user);
      if (event === 'SIGNED_OUT') {
        user.value = null; // 로그아웃 시 사용자 상태 즉시 초기화
        closeAuthModal();
      } else {
        user.value = session?.user ?? null;
        if (user.value) {
          closeAuthModal();
          await initializeSession();
        }
      }
    });

    watch(user, (newUser) => {
      console.log('사용자 상태 업데이트:', newUser);
    });

    return {
      currentMenu,
      showAuthModal,
      isLoginForm,
      user,
      selectMenu,
      toggleAuthModal,
      closeAuthModal,
      authWithGitHub,
      writePost,
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
.login-btn {
  bottom: 20px;
  right: 20px;
  position: fixed;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.write-btn {
  bottom: 20px;
  left: 20px;
  position: fixed;
  padding: 0.5rem 1rem;
  background-color: #282aa7;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #141414;
  padding: 2rem;
  border-radius: 8px;
  width: min(90vw, 400px);
  position: relative;
}
.close-btn {
  color: #fff;
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.github-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #24292e;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}
.github-icon {
  fill: white;
}
.auth-form p {
  text-align: center;
}
.toggle-form {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}
</style>