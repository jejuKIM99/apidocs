<template>
  <div>
    
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Title or Contents..."
        class="search-input"
      />
    </div>

    <div v-if="currentMenu === 'Library'" class="cli-filter">
      <label for="cli-filter">Is CLI</label>
      <input
        type="checkbox"
        id="cli-filter"
        v-model="isCliFilter"
      />
    </div>

    
    <div v-if="currentMenu === 'Fonts'" class="font-preview-input">
      <input v-model="previewText" placeholder="Preview Text" style="width: 400px; height: 30px; border-radius: 6px; border: solid 1px #40ed21; background-color: #000; color: #fff;" />
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
</template>

<script>
export default {
  data() {
    return {
      posts: [],
      previewText: '',
      fontSize: 24,
      fontWeight: 'normal',
      searchQuery: '',
      isFreeFontFilter: false,
      isCliFilter: false,
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
  },
  inject: ['currentMenu', 'setCurrentMenu'],
  watch: {
    fontSize(newValue) {
      if (this.$refs.fontSizeSlider) {
        this.$refs.fontSizeSlider.style.setProperty('--value', newValue);
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
  max-width: 400px;
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
  gap: 1rem;
  padding: 1rem;
}

.card {
  font-family: "Signika Negative", sans-serif;
  border: 2px solid #40ed21;
  border-radius: 5px;
  width: min(80vw, 300px);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background-color: #000;
}

.card-header {
  position: relative;
  background-color: #40ed21;
  color: #000;
  text-align: center;
  padding: 2px;
  font-weight: bold;
}

.card-id {
  font-size: 1.2rem;
}

.cli-badge {
  position: absolute;
  width: 100px;
  top: 50px;
  left: -34px;
  background-color: #ff0000;
  color: #fff;
  padding: 0.5rem;
  transform: rotate(-45deg);
  transform-origin: 0 0;
  z-index: 1;
}

.card img {
  width: 100%;
  height: 200px;
  object-fit: contain;
}

.no-image {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  color: #666;
}

.font-preview {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #212121;
  color: white;
}

.card .content {
  border-top: solid 2px;
  padding: 1rem;
  background-color: #000;
}

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
</style>