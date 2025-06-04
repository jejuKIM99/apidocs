<template>
  <div>
    <nav class="navbar">
      <ul class="nav-menu">
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('Library')"
            :class="{ 'active': currentMenu === 'Library' }"
          >Library</NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('Framework')"
            :class="{ 'active': currentMenu === 'Framework' }"
          >Framework</NuxtLink>
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
        <li>
          <NuxtLink
            to="/"
            @click="selectMenu('Quick Start')"
            :class="{ 'active': currentMenu === 'Quick Start' }"
          >Quick Start</NuxtLink>
        </li>
      </ul>
    </nav>
    <button
      class="cart-toggle-btn"
      @click="toggleCart"
    >
      <img src="./assets/css/trolley_24dp_40ED21_FILL0_wght400_GRAD0_opsz24.svg">
      <span v-if="cartItems.length > 0" class="cart-indicator"><img src="./assets/css/deployed_code_alert_24dp_FF0000_FILL0_wght400_GRAD0_opsz24.svg" style="width: 30px;"></span>
    </button>

    <transition name="help-slide">
      <div v-if="showHelp" class="help-panel">
        <button class="help-close-btn" @click="toggleHelp"><img src="./assets/css/close_24dp_FFF_FILL0_wght400_GRAD0_opsz24.svg"></button>
        <div class="help-content">
          <div class="help-section">
            <h3>Step 1: Install Cojus</h3>
            <p style="font-size: 12px; color: #bbb;">Set up your environment by installing <span style="color: #2cdb43; font-size: 14px; font-weight: bold;">cojus-cli.</span></p>
            <div
              class="help-command"
              @click="copyCommand('npm i cojus-cli')"
              style="cursor: pointer;"
            >
              npm i cojus-cli
            </div>
          </div>
          <div class="help-section">
            <h3>Step 2: Install Cart Items</h3>
            <p style="font-size: 12px; color: #bbb;">Use the <span style="color: #2cdb43; font-size: 14px; font-weight: bold;">cojus</span> command to install your selected items. (Supports multiple installations)</p>
            <div
              class="help-command"
              @click="copyCommand(installCommand)"
              style="cursor: pointer;"
            >
              {{ installCommand }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="cart-slide">
      <div v-if="showCart" class="cart-panel">
        <button class="cart-close-btn" @click="closeAllPanels"><img src="./assets/css/close_24dp_FFF_FILL0_wght400_GRAD0_opsz24.svg"></button>
        <button class="help-btn" @click="toggleHelp"><img src="./assets/css/terminal_24dp_40ED21_FILL0_wght400_GRAD0_opsz24.svg"> </button>
        <div class="cart-items-container">
          <div
            v-for="(item, index) in cartItems"
            :key="index"
            class="cart-item"
          >
            <div class="cart-item-title">{{ item.title }}</div>
            <div
              class="cart-item-command"
              @click="copyCommand(item.npm_command)"
              style="cursor: pointer;"
            >
              {{ item.npm_command }}
            </div>
            <button
              class="cart-item-remove-btn"
              @click="removeLibrary(index)"
              title="이 항목 삭제"
            >
              <img src="./assets/css/delete_forever_24dp_40ED21_FILL0_wght400_GRAD0_opsz24.svg">
            </button>
          </div>
          <p v-if="cartItems.length === 0" class="cart-empty-msg">
            Is Empty.
          </p>
        </div>
      </div>
    </transition>

    <NuxtPage />
    <transition name="copy-slide">
      <div v-if="showCopyModal" class="copy-modal">
        Copy!
      </div>
    </transition>
    <transition name="add-slide">
      <div v-if="showAddModal" class="add-modal">
        Add List!
      </div>
    </transition>
    <transition name="duplicate-slide">
      <div v-if="showDuplicateModal" class="duplicate-modal">
        Duplicate!
      </div>
    </transition>
    <SpeedInsights />
  </div>

  <footer class="footer">
    <img src="./assets/css/footer_img.png" style="width: 500px; max-width: 100%;" >
    <p>© 2025 Code-Jesus Project. All rights reserved.</p>
    <p><img src="./assets/css/github.png" style="filter: invert(1); margin-right: 10px;" > <a href="https://github.com/jejuKIM99" target="_blank">jejuKIM99 GitHub</a></p>
    <p><img src="./assets/css/npm.png" style="margin-right: 10px;"> <a href="https://www.npmjs.com/package/cojus-cli" target="_blank">cojus-cli</a> </p>
  </footer>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  setup() {
    const currentMenu = ref('Library');

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
      addLibrary: this.addLibrary,
    };
  },
  data() {
    return {
      cartItems: [],
      showCart: false,
      showCopyModal: false,
      showAddModal: false,
      showHelp: false,
      showDuplicateModal: false, // 중복 모달 표시 여부 추가
    };
  },
  computed: {
    installCommand() {
      if (this.cartItems.length === 0) {
        return 'npx cojus';
      }
      const docIds = this.cartItems.map(item => item.docId).join(' -');
      return `npx cojus -${docIds}`;
    },
  },
  methods: {
    addLibrary(item) {
      const exists = this.cartItems.some(existingItem => existingItem.docId === item.docId);
      if (exists) {
        this.showDuplicateModal = true;
        setTimeout(() => {
          this.showDuplicateModal = false;
        }, 1000);
      } else {
        this.cartItems.push({
          ...item,
          docId: item.docId,
        });
        this.showAddModal = true;
        setTimeout(() => {
          this.showAddModal = false;
        }, 1000);
      }
    },
    removeLibrary(index) {
      this.cartItems.splice(index, 1);
    },
    toggleCart() {
      this.showCart = !this.showCart;
    },
    toggleHelp() {
      this.showHelp = !this.showHelp;
    },
    closeAllPanels() {
      this.showCart = false;
      this.showHelp = false;
    },
    copyCommand(command) {
      navigator.clipboard.writeText(command)
        .then(() => {
          this.showCopyModal = true;
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
  padding: 1rem 0px;
  background: linear-gradient(180deg, #2fad19 0%, #ffffff00 90%);
}
.nav-menu {
  flex-wrap: wrap;
  list-style: none;
  display: flex;
  gap: 1rem;
}
.nav-menu li a {
  font-size: min(5vw, 24px);
  text-decoration: none;
  color: #a5a5a5;
}
.nav-menu li a.active {
  color: #40ed21;
}
.nav-menu li a:hover{
  color: #40ed21;
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

.footer p{
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer a {
  color: #40ed21;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

.cart-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #000;
  color: #fff;
  border: solid 2px #2cdb43;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-indicator {
  position: absolute;
  top: -14px;
  left: -14px;
}

.cart-panel {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 70vw;
  max-width: 300px;
  height: 100vw;
  max-height: 400px;
  background-color: #000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border: solid 2px #2cdb43;
  border-bottom: none;
  overflow-y: auto;
  z-index: 1001;
  padding: 1rem;
}

.cart-panel::-webkit-scrollbar,
.help-panel::-webkit-scrollbar {
  width: 6px;
}

.cart-panel::-webkit-scrollbar-thumb,
.help-panel::-webkit-scrollbar-thumb {
  background-color: #2cdb43;
  border-radius: 8px;
  border: 4px solid #2cdb43;
}

.cart-panel::-webkit-scrollbar-track,
.help-panel::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

.cart-slide-enter-active,
.cart-slide-leave-active {
  transition: transform 0.3s ease-out;
}
.cart-slide-enter-from,
.cart-slide-leave-to {
  transform: translateY(100%);
}
.cart-slide-enter-to,
.cart-slide-leave-from {
  transform: translateY(0);
}

.help-panel {
  position: fixed;
  bottom: 0px;
  right: 338px;
  width: 70vw;
  max-width: 300px;
  height: 70vw;
  max-height: 310px;
  background-color: #141414;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border: solid 2px #2cdb43;
  border-bottom: none;
  z-index: 1002;
  padding: 1rem;
  overflow-y: auto;
}

@media screen and (max-width: 680px){.help-panel{right: 0px;}}

.help-slide-enter-active,
.help-slide-leave-active {
  transition: transform 0.3s ease-out;
}
.help-slide-enter-from,
.help-slide-leave-to {
  transform: translateY(100%);
}
.help-slide-enter-to,
.help-slide-leave-from {
  transform: translateY(0);
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.help-section {
  margin-bottom: 1rem;
}

.help-section h3 {
  margin-bottom: 0.5rem;
  color: #fff;
}

.help-command {
  font-family: monospace;
  color: #fff;
  background-color: #2d2d2d;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.cart-items-container {
  margin-top: 1.4rem;
}
.cart-item {
  position: relative;
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

.cart-empty-msg {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 2rem;
}

.cart-close-btn,
.help-close-btn {
  position: absolute;
  top: 4px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #fff;
}

.help-btn {
  position: absolute;
  top: 4px;
  left: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #fff;
}

    .help-btn::after {
      content: "Convert to cojus";
      position: absolute;
      color: #2cdb43;
      opacity: 0;
      transition: opacity 0.2s ease;
      width: 100px;
      top: 4px;
      font-weight: bold;
      font-family: "Signika Negative", sans-serif;
    }

    .help-btn:hover::after {
      opacity: 1;
    }
.copy-modal,
.add-modal {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #40ed21;
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.copy-slide-enter-active,
.copy-slide-leave-active,
.add-slide-enter-active,
.add-slide-leave-active {
  transition: all 0.3s ease-out;
}
.copy-slide-enter-from,
.copy-slide-leave-to,
.add-slide-enter-from,
.add-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}
.copy-slide-enter-to,
.copy-slide-leave-from,
.add-slide-enter-to,
.add-slide-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.duplicate-modal {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff4d4d;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.duplicate-slide-enter-active,
.duplicate-slide-leave-active {
  transition: all 0.3s ease-out;
}
.duplicate-slide-enter-from,
.duplicate-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}
.duplicate-slide-enter-to,
.duplicate-slide-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

</style>