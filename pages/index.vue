<template>
  <div>
    <!-- Quick Start를 제외한 메뉴에서 기존 검색창 유지 -->
    <div v-if="currentMenu !== 'Quick Start'" class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Title or Contents..."
        class="search-input"
      />
    </div>

    <div
      v-if="currentMenu === 'Quick Start'"
      class="sidebar-toggle"
      @click="toggleSidebar"
      :class="{ open: isSidebarOpen }"
    >
      <span>
        <img
          v-if="isSidebarOpen"
          src="@/assets/css/arrow_left_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"
          alt="접기"
        />
        <img
          v-else
          src="@/assets/css/arrow_right_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"
          alt="펼치기"
        />
      </span>
    </div>


    <!-- 사이드바 (Quick Start 메뉴에서만 표시) -->
    <div v-if="currentMenu === 'Quick Start'" class="sidebar" :class="{ 'open': isSidebarOpen }" @click.stop>
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Title or Contents..."
          class="search-input"
        />
      </div>
      <div class="quick-start-list">
        <div v-if="currentPosts.length > 0">
          <div
            v-for="post in currentPosts"
            :key="post.id"
            @click="selectPost(post)"
            :class="{ 'selected': post === selectedPost }"
          >
            {{ post.title }}
          </div>
        </div>
        <div v-else>
          <p>Quick Start 게시글이 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 사이드바 외부 클릭으로 닫기 위한 오버레이 -->
    <div v-if="isSidebarOpen && currentMenu === 'Quick Start'" class="sidebar-overlay" @click="toggleSidebar"></div>

    <div v-if="currentMenu === 'Library'" class="cli-filter">
      <label for="cli-filter">Is CLI</label>
      <input
        type="checkbox"
        id="cli-filter"
        v-model="isCliFilter"
      />
    </div>

    <div v-if="currentMenu === 'Fonts'" class="font-preview-input">
      <input v-model="previewText" placeholder="Preview Text" style="width: 240px; height: 40px; border-radius: 6px; border: dashed 2px #40ed21; background-color: #000; color: #fff;" />
      <div class="font-controls">
        <label for="font-size">Font-size: {{ fontSize }}px</label>
        <input
          type="range"
          id="font-size"
          ref="fontSizeSlider"
          v-model.number="fontSize"
          min="12"
          max="48"
          step="1"
        />
        <label for="font-weight">Font-weight:</label>
        <select id="font-weight" v-model="fontWeight">
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="300">300</option>
          <option value="400">400</option>
          <option value="500">500</option>
          <option value="600">600</option>
          <option value="700">700</option>
          <option value="800">800</option>
          <option value="900">900</option>
        </select>
        <label for="free-font-filter">Totally Free</label>
        <input
          type="checkbox"
          id="free-font-filter"
          v-model="isFreeFontFilter"
        />
      </div>
    </div>

    <div v-if="currentMenu === 'Quick Start'" class="quick-start-container">
      <div class="quick-start-content">
        <div v-if="selectedPost">
          <div
            class="post-header"
            :style="selectedPost.image_url ? { backgroundImage: `url(${selectedPost.image_url})` } : {}"
          >
            <div class="post-id">{{ selectedPost.id }}</div>
            <div class="text-back"></div>
            <h1>{{ selectedPost.title }}</h1>
            <button v-if="selectedPost.npm_command" class="add-npm-btn" @click="addToCart(selectedPost)">Add Npm</button>
          </div>
          <div class="post-content markdown-body">
            <div class="language-switch">
              <label class="custom_radio">
                <input type="radio" value="KO" v-model="language" /> <span>KO</span>
              </label>
              <label class="custom_radio">
                <input type="radio" value="EN" v-model="language" /> <span>EN</span>
              </label>
            </div>
            <div v-if="language === 'KO'" v-html="parsedSelectedContent"></div>
            <div v-else-if="enContent" v-html="parseMarkdown(enContent)"></div>
            <div v-else class="no-translation">
              <img src="/assets/css/404_1.png" alt="No-translation" />
              <p>Translation in progress. We will upload the translation as soon as possible. Sorry for the inconvenience.</p>
            </div>
          </div>
        </div>
        <div v-else>
          <p>게시글을 선택하세요.</p>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="card-wrapper">
        <div class="card-container">
          <NuxtLink v-for="(post, index) in currentPosts" :key="index" :to="`/post/${post.id}`" class="card">
            <div class="card-header">
              <div class="card-id">{{ post.id }}</div>
              <div v-if="post.npm_command" class="cli-badge">Is CLI</div>
            </div>
            <div v-if="post.type !== 'Fonts'">
              <img v-if="post.image_url" :src="post.image_url" alt="게시글 이미지" />
              <div v-else class="no-image">이미지 없음</div>
            </div>
            <div v-else class="font-preview" :style="{ fontFamily: post.font_name || 'sans-serif', fontSize: `${fontSize}px`, fontWeight: fontWeight }">
              {{ previewText || 'preview' }}
            </div>
            <div class="content">
              <h3>{{ post.title }}</h3>
              <p>{{ post.date }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { parseMarkdown } from '~/utils/markdownParser';

export default {
  inject: ['currentMenu', 'setCurrentMenu', 'addLibrary'],
  data() {
    return {
      posts: [],
      previewText: '',
      fontSize: 24,
      fontWeight: 'normal',
      searchQuery: '',
      isFreeFontFilter: false,
      isCliFilter: false,
      selectedPost: null,
      isSidebarOpen: false,
      language: 'KO', // 언어 선택 상태 추가
      enContent: null, // 영어 내용 상태 추가
    };
  },
  computed: {
    currentPosts() {
      console.log('현재 메뉴:', this.currentMenu);
      let filteredPosts = this.posts.filter(post => {
        console.log('게시글 데이터:', post);
        if (this.currentMenu === 'Library') {
          return post.type === 'API' && post.is_framework === false;
        } else if (this.currentMenu === 'Framework') {
          return post.type === 'API' && post.is_framework === true;
        } else {
          return post.type === this.currentMenu;
        }
      });
      console.log('필터링된 게시글:', filteredPosts);

      if (this.currentMenu === 'Library' && this.isCliFilter) {
        filteredPosts = filteredPosts.filter(post => post.npm_command != null);
      }

      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        filteredPosts = filteredPosts.filter(post => {
          const titleMatch = post.title.toLowerCase().includes(query);
          const contentMatch = post.content ? post.content.toLowerCase().includes(query) : false;
          return titleMatch || contentMatch;
        });
      }

      if (this.currentMenu === 'Fonts' && this.isFreeFontFilter) {
        filteredPosts = filteredPosts.filter(post => post.is_free_font === true);
      }

      return filteredPosts;
    },
    parsedSelectedContent() {
      return this.selectedPost ? parseMarkdown(this.selectedPost.content) : '';
    },
  },
  watch: {
    fontSize(newValue) {
      if (this.$refs.fontSizeSlider) {
        this.$refs.fontSizeSlider.style.setProperty('--value', newValue);
      }
    },
    currentPosts(newPosts) {
      if (this.currentMenu === 'Quick Start') {
        this.selectedPost = newPosts[0] || null;
      }
    },
    currentMenu(newMenu) {
      if (newMenu === 'Fonts') {
        this.$nextTick(() => {
          if (this.$refs.fontSizeSlider) {
            this.$refs.fontSizeSlider.value = this.fontSize;
            this.$refs.fontSizeSlider.style.setProperty('--value', this.fontSize);
          }
        });
      }
      this.isSidebarOpen = false;
    },
    language(newLang) {
      if (newLang === 'EN' && this.selectedPost) {
        this.fetchEnContent();
      } else {
        this.enContent = null;
      }
    },
    selectedPost(newPost) {
      if (newPost && this.language === 'EN') {
        this.fetchEnContent();
      } else {
        this.enContent = null;
      }
    },
  },
  methods: {
    async fetchPosts() {
      try {
        const { data, error } = await this.$supabase
          .from('api_posts')
          .select('*, npm_command, is_framework')
          .order('id', { ascending: false });
        if (error) {
          console.error('게시글 가져오기 오류:', error);
          return;
        }
        if (!data || data.length === 0) {
          console.log('데이터가 없습니다.');
          this.posts = [];
        } else {
          this.posts = data.map(post => ({
            id: post.id,
            title: post.title,
            date: post.created_at,
            image_url: post.image_url,
            font_cdn: post.font_cdn,
            font_name: this.extractFontName(post.font_cdn, post.title),
            type: post.type,
            content: post.content,
            is_free_font: post.is_free_font,
            npm_command: post.npm_command,
            is_framework: post.is_framework,
          }));
          console.log('가져온 게시글:', this.posts);
          await this.loadFonts();
        }
      } catch (err) {
        console.error('게시글 가져오기 중 예기치 않은 오류:', err);
      }
    },
    extractFontName(fontCdn, title) {
      if (!fontCdn) {
        return 'sans-serif';
      }
      if (fontCdn.includes('fonts.googleapis.com')) {
        const match = fontCdn.match(/family=([^&:]+)/);
        if (match) {
          const fontFamily = match[1].split(':')[0].replace(/\+/g, ' ');
          return fontFamily;
        }
        return 'sans-serif';
      }
      if (fontCdn.includes('fonts.cdnfonts.com')) {
        const match = fontCdn.match(/css\/(.+)/);
        return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'sans-serif';
      }
      return 'sans-serif';
    },
    async loadFonts() {
      const loadedFonts = new Set();
      for (const post of this.posts) {
        if (post.type === 'Fonts' && post.font_cdn && !loadedFonts.has(post.font_cdn)) {
          loadedFonts.add(post.font_cdn);
          try {
            let href = post.font_cdn;
            if (href.includes('fonts.googleapis.com') && !href.includes('display=')) {
              href += '&display=swap';
            }
            const link = document.createElement('link');
            link.href = href;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            await new Promise(resolve => {
              link.onload = resolve;
              link.onerror = () => {
                console.warn(`폰트 로드 실패: ${href}`);
                resolve();
              };
            });
          } catch (err) {
            console.warn(`폰트 로드 중 오류: ${post.font_cdn}`, err);
          }
        }
      }
    },
    selectPost(post) {
      this.selectedPost = post;
    },
    addToCart(post) {
      if (!post || !post.npm_command) return;
      this.addLibrary({
        title: post.title,
        npm_command: post.npm_command,
        docId: post.id,
      });
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    async fetchEnContent() {
      if (!this.selectedPost) return;
      const { data, error } = await this.$supabase
        .from('api_posts_en')
        .select('content')
        .eq('post_id', this.selectedPost.id)
        .single();
      if (error) {
        console.error('Error fetching English content:', error);
        this.enContent = null;
      } else {
        this.enContent = data ? data.content : null;
      }
    },
    parseMarkdown,
  },
  mounted() {
    this.fetchPosts();
    this.$nextTick(() => {
      if (this.$refs.fontSizeSlider) {
        this.$refs.fontSizeSlider.value = this.fontSize;
        this.$refs.fontSizeSlider.style.setProperty('--value', this.fontSize);
      }
    });
  },
};
</script>

<style scoped>
.search-container {
  text-align: center;
  margin: 1rem 0;
}

.search-input {
  width: 100%;
  max-width: 280px;
  padding: 0.5rem;
  border: 1px solid #40ed21;
  border-radius: 5px;
  font-size: 1rem;
  background-color: #000;
  color: #40ed21;
}

.card-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-container {
  max-width: 1200px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem; /* Increased gap */
  padding: 1rem;
}

/* Updated Card Styles for Trendy/Futuristic Look */
.card {
  font-family: "Signika Negative", sans-serif;
  border: 2px solid;
  border-color: #40ed2147;
  border-radius: 12px; /* Slightly more rounded corners */
  width: min(80vw, 300px);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(180deg, #000 90%, #6fc4c5 158%);
  position: relative; /* For pseudo-elements */
  transition: all 0.3s ease-in-out; /* Smooth transitions for all properties */
  /* Subtle outer glow and inner glow */
  box-shadow: 0 5px 15px rgba(0, 255, 0, 0.2), inset 0 0 8px rgba(0, 255, 0, 0.1);
  display: flex; /* Flexbox for internal layout control */
  flex-direction: column; /* Stack content vertically */
  justify-content: space-between; /* Push header/content to ends */
  color: #e0e0e0; /* Lighter text for dark background */
}

/* Pseudo-element for glowing border on hover */
.card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  z-index: -1;
  border-radius: 14px; /* Slightly larger than card radius */
  opacity: 0; /* Hidden by default */
  transition: opacity 0.3s ease-in-out;
}

/* Hover effects for the card */
.card:hover {
  transform: translateY(-10px) scale(1.02); /* Lift and slightly enlarge on hover */
  /* Enhanced glow on hover */
  box-shadow: 0 10px 30px rgba(0, 255, 0, 0.4), inset 0 0 15px rgba(0, 255, 0, 0.2);
  border-color: #40ed21;
}

.card:hover::before {
  opacity: 1; /* Show glowing border on hover */
}

.card-header {
  position: relative;
  background: linear-gradient(90deg, #6fc4c5, #2cdb43); /* Green gradient for header */
  color: #000;
  text-align: center;
  padding: 8px; /* Increased padding */
  font-weight: bold;
  border-radius: 10px 10px 0 0; /* Match card radius, top only */
}

.card-id {
  font-size: 1.4rem; /* Slightly larger font size */
  letter-spacing: 1px; /* Spacing for a futuristic look */
}

.cli-badge {
  position: absolute;
  width: 120px; /* Slightly larger badge */
  top: 66px;
  left: -38px; /* Adjusted position for wider badge */
  background: linear-gradient(45deg, #ff0000, #cc0000); /* Red gradient for CLI badge */
  color: #fff;
  padding: 0.5rem 0.8rem; /* More padding */
  transform: rotate(-45deg);
  transform-origin: 0 0;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.4); /* Shadow for badge */
  font-size: 0.85rem; /* Smaller font for better fit */
  text-transform: uppercase; /* All caps */
  letter-spacing: 1px;
}

.card img {
  width: 100%;
  height: 180px; /* Slightly reduced height for better card proportion */
  object-fit: contain;
  border-bottom: 1px solid rgba(64, 237, 33, 0.3); /* Subtle green line below image */
}

.no-image {
  width: 100%;
  height: 180px; /* Match img height */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333; /* Darker placeholder background */
  color: #999;
  font-size: 1.1rem;
  font-style: italic;
  border-bottom: 1px solid rgba(64, 237, 33, 0.3);
}

.font-preview {
  height: 180px; /* Match img height */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000; /* Darker background for font preview */
  color: white;
  border-bottom: 1px solid rgba(64, 237, 33, 0.3);
}

.card .content {
  padding: 1rem;
  background-color: transparent; /* Let the card's gradient background show through */
  flex-grow: 1; /* Allow content to grow and push to bottom */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card .content h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #40ed21; /* Green title */
  font-size: 1.25rem;
  text-shadow: 0 0 5px rgba(64, 237, 33, 0.3); /* Subtle text glow */
}

.card .content p {
  font-size: 0.85rem;
  color: #b0b0b0; /* Lighter grey for date */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-container {
    padding: 0.5rem;
    gap: 1rem; /* Slightly smaller gap on mobile */
  }
  .card {
    width: 90vw; /* On smaller screens, take up more width */
  }
}


/* Existing styles below for other components */
.font-preview-input {
  text-align: center;
  margin: 1rem 0;
}

.font-preview-input input[type="text"] {
  padding: 0.5rem;
  width: 300px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.font-controls {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.font-controls label {
  font-size: 0.9rem;
}

.font-controls input[type="range"] {
  height: 8px;
  -webkit-appearance: none;
  background: #000;
  border-radius: 5px;
  outline: auto;
}

.font-controls input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(to right, #40ed21 calc((var(--value) - 12) / (48 - 12) * 100%), #000 calc((var(--value) - 12) / (48 - 12) * 100%));
}

.font-controls input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
  background: #40ed21;
  border-radius: 0 50% 50% 0;
  cursor: pointer;
  margin-top: 0;
}

.font-controls input[type="range"]::-moz-range-track {
  height: 8px;
  background: #000;
  border-radius: 5px;
}

.font-controls input[type="range"]::-moz-range-thumb {
  width: 8px;
  height: 8px;
  background: #40ed21;
  border: none;
  border-radius: 0 50% 50% 0;
  cursor: pointer;
}

.font-controls input[type="range"]::-moz-range-progress {
  background: #40ed21;
  height: 8px;
  border-radius: 5px;
}

.font-controls input[type="range"] {
  --value: 24;
}

.font-controls select,
.font-controls input[type="checkbox"] {
  font-weight: bold;
  color: #000;
  background-color: #40ed21;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
}

[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #40ed21;
}

.cli-filter {
  text-align: center;
  margin: 1rem 0;
}

.cli-filter label {
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.cli-filter input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #40ed21;
}

.quick-start-container {
  display: flex;
  gap: 2rem;
}

.quick-start-content {
  width: 100%;
}

.quick-start-content .post-id {
  position: absolute;
  top: 10px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  z-index: 2;
  width: 230px;
  border-radius: 20px;
  text-align: center;
  padding: 6px;
  background-color: #2cdb43;
  text-shadow: 0 0 5px black;
}

.quick-start-content .post-header {
  position: relative;
  height: 300px;
  background-size: contain;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-shadow: 0 0 5px black;
}

.quick-start-content .post-header .text-back {
  width: 100%;
  height: 100%;
  position: absolute;
  background: #000000bd;
  z-index: 0;
  border-bottom: solid 2px #2cdb43;
  border-top: solid 2px #2cdb43;
}

.quick-start-content .post-header h1 {
  margin: 0;
  font-size: 2.5rem;
  z-index: 2;
}

.quick-start-content .post-content {
  width: 80vw;
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #141414;
  border: 2px solid #2cdb43;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #fff;
  position: relative;
}

.add-npm-btn {
  font-family: 'Super Guardian', sans-serif;
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.4rem;
  z-index: 2;
}

.add-npm-btn:hover {
  color: #32c91e;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100%;
  background-color: #141414;
  border-right: 2px solid #40ed21;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar .search-container {
  margin-bottom: 1rem;
}

.sidebar .quick-start-list {
  width: 100%;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

.sidebar .quick-start-list div {
  padding: 0.5rem;
  cursor: pointer;
}

.sidebar .quick-start-list div.selected {
  background-color: #40ed21;
  color: #000;
}

.sidebar-toggle {
  position: fixed;
  top: 50%;
  left: calc(334px * var(--sidebar-open, 0));
  transform: translateY(-50%);
  width: 30px;
  height: 140px;
  background-color: #40ed21;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  border-radius: 0 5px 5px 0;
  transition: left 0.3s ease-in-out, background-color 0.3s ease;
}

.sidebar-toggle.open {
  --sidebar-open: 1;
}

.sidebar-toggle:hover {
  background-color: #32c91e;
}

.sidebar-toggle span img {
  width: 2.4rem;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.language-switch {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
}

.no-translation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.no-translation img {
  width: 400px;
}

.custom_radio {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.custom_radio span {
  font-weight: bold;
  margin-left: 6px;
}

.custom_radio [type="radio"] {
  appearance: none;
  margin: 0px;
  padding: 0px;
  box-sizing: border-box;
  border: 2px solid #dcdcdc;
  border-radius: 250px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.custom_radio [type="radio"]:checked {
  box-sizing: border-box;
  border: 5px solid #2cdb43;
}

.custom_radio [type="radio"]:disabled {
  background-color: #dcdcdc;
}

.custom_radio [type="radio"]:disabled + span {
  color: #dcdcdc;
}
</style>
