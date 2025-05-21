<template>
  <div>
    <!-- 검색창 -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="제목 또는 본문에서 검색..."
        class="search-input"
      />
    </div>

    <!-- Fonts 게시판 텍스트 입력 폼 및 설정 -->
    <div v-if="currentMenu === 'Fonts'" class="font-preview-input">
      <input v-model="previewText" placeholder="미리보기 텍스트를 입력하세요" style="width: 400px; height: 30px; border-radius: 6px; border: solid 1px #40ed21; background-color: #000;" />
      <div class="font-controls">
        <label for="font-size">Font-size: {{ fontSize }}px</label>
        <input
          type="range"
          id="font-size"
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

    <!-- 게시글 카드 컨테이너 -->
    <div class="card-wrapper">
      <div class="card-container">
        <NuxtLink v-for="(post, index) in currentPosts" :key="index" :to="`/post/${post.id}`" class="card">
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
    };
  },
  computed: {
    currentPosts() {
      let filteredPosts = this.posts.filter(post => post.type === this.currentMenu);

      // 검색어 필터링
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        filteredPosts = filteredPosts.filter(post => {
          const titleMatch = post.title.toLowerCase().includes(query);
          const contentMatch = post.content ? post.content.toLowerCase().includes(query) : false;
          return titleMatch || contentMatch;
        });
      }

      // 완전 무료 폰트 필터링
      if (this.currentMenu === 'Fonts' && this.isFreeFontFilter) {
        filteredPosts = filteredPosts.filter(post => post.is_free_font === true);
      }

      return filteredPosts;
    },
  },
  inject: ['currentMenu', 'setCurrentMenu'],
  methods: {
    async fetchPosts() {
      try {
        const { data, error } = await this.$supabase.from('api_posts').select('*');
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
          }));
          this.loadFonts();
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
        const match = fontCdn.match(/family=([^&]+)/);
        return match ? match[1].replace('+', ' ') : 'sans-serif';
      }
      if (fontCdn.includes('fonts.cdnfonts.com')) {
        const match = fontCdn.match(/css\/(.+)/);
        return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'sans-serif';
      }
      return 'sans-serif';
    },
    loadFonts() {
      const loadedFonts = new Set();
      this.posts.forEach(post => {
        if (post.type === 'Fonts' && post.font_cdn && !loadedFonts.has(post.font_cdn)) {
          loadedFonts.add(post.font_cdn);
          const link = document.createElement('link');
          link.href = post.font_cdn;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });
    },
  },
  mounted() {
    this.fetchPosts();
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
}

.card {
  border: 1px solid #ddd;
  border-radius: 5px;
  width: min(80vw, 300px);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}

.card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
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
  width: 150px;
}

.font-controls select,
.font-controls input[type="checkbox"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
}
</style>