<template>
  <div class="write-container">
    <div class="header">
      <h2>게시글 작성</h2>
      <button class="close-btn" @click="closeForm">×</button>
    </div>
    <form @submit.prevent="submitPost">
      <!-- 메뉴 카테고리 선택 -->
      <div class="form-group">
        <label for="category">카테고리</label>
        <select id="category" v-model="form.type" required>
          <option value="API">API</option>
          <option value="Fonts">Fonts</option>
          <option value="CSS Code">CSS Code</option>
          <option value="Free">Free Board</option>
        </select>
      </div>

      <!-- Fonts 카테고리일 때 font_cdn 및 무료 폰트 체크박스 -->
      <div v-if="form.type === 'Fonts'" class="form-group">
        <label for="font-cdn">폰트 CDN</label>
        <input
          id="font-cdn"
          v-model="form.font_cdn"
          type="url"
          placeholder="예: https://fonts.googleapis.com/css?family=Roboto"
          required
        />
        <label for="free-font">
          <input
            id="free-font"
            type="checkbox"
            v-model="form.is_free_font"
          />
          완전 무료 폰트
        </label>
      </div>

      <!-- 제목 -->
      <div class="form-group">
        <label for="title">제목</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="게시글 제목을 입력하세요"
          required
        />
      </div>

      <!-- 대표 이미지 업로드 -->
      <div class="form-group">
        <label for="image-upload">대표 이미지</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          @change="uploadImage"
          :disabled="uploading"
        />
        <p v-if="uploading">이미지 업로드 중...</p>
        <p v-if="form.image_url">업로드된 이미지 URL: {{ form.image_url }}</p>
      </div>

      <!-- 툴바 -->
      <div class="toolbar">
        <button type="button" @click="insertMarkdown('h1')">H1</button>
        <button type="button" @click="insertMarkdown('h2')">H2</button>
        <button type="button" @click="insertMarkdown('h3')">H3</button>
        <button type="button" @click="insertMarkdown('bold')">굵은 글씨</button>
        <button type="button" @click="insertMarkdown('italic')">기울임</button>
        <button type="button" @click="insertMarkdown('code')">인라인 코드</button>
        <button type="button" @click="insertMarkdown('codeBlock')">코드 블록</button>
        <button type="button" @click="insertMarkdown('link')">링크</button>
        <button type="button" @click="insertMarkdown('image')">이미지</button>
        <button type="button" @click="insertMarkdown('list')">목록</button>
        <button type="button" @click="insertMarkdown('quote')">인용문</button>
        <button type="button" @click="insertMarkdown('table')">표</button>
        <button type="button" @click="insertMarkdown('checklist')">체크리스트</button>
        <button type="button" @click="insertMarkdown('hr')">수평선</button>
      </div>

      <!-- 본문 내용 -->
      <div class="form-group">
        <label for="content">본문 내용 (Markdown)</label>
        <textarea
          id="content"
          v-model="form.content"
          ref="contentTextarea"
          placeholder="Markdown 형식으로 내용을 입력하세요"
          rows="10"
          required
        ></textarea>
      </div>

      <!-- 제출 버튼 -->
      <button type="submit" class="submit-btn" :disabled="uploading">게시글 저장</button>
    </form>

    <!-- 메시지 표시 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { useRouter } from '#app';

export default {
  setup() {
    return {
      router: useRouter(),
    };
  },
  data() {
    return {
      form: {
        type: 'API',
        title: '',
        image_url: '',
        content: '',
        font_cdn: '',
        is_free_font: false,
      },
      uploading: false,
      message: '',
      messageType: '',
    };
  },
  methods: {
    closeForm() {
      this.router.back();
    },
    insertMarkdown(type) {
      const textarea = this.$refs.contentTextarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = this.form.content.slice(start, end);
      let insertText = '';
      let newCursorPos = start;

      switch (type) {
        case 'h1':
          insertText = `# ${selectedText || '제목'}`;
          newCursorPos = start + 2;
          break;
        case 'h2':
          insertText = `## ${selectedText || '부제목'}`;
          newCursorPos = start + 3;
          break;
        case 'h3':
          insertText = `### ${selectedText || '소제목'}`;
          newCursorPos = start + 4;
          break;
        case 'bold':
          insertText = `**${selectedText || '텍스트'}**`;
          newCursorPos = selectedText ? start + 2 : start + 2;
          break;
        case 'italic':
          insertText = `*${selectedText || '텍스트'}*`;
          newCursorPos = selectedText ? start + 1 : start + 1;
          break;
        case 'code':
          insertText = `\`${selectedText || '코드'}\``;
          newCursorPos = selectedText ? start + 1 : start + 1;
          break;
        case 'codeBlock':
          insertText = `\`\`\`\n${selectedText || '코드 입력'}\n\`\`\``;
          newCursorPos = start + 4;
          break;
        case 'link':
          insertText = `[${selectedText || '링크 텍스트'}](https://example.com)`;
          newCursorPos = start + (selectedText ? selectedText.length + 3 : 3);
          break;
        case 'image':
          insertText = `![${selectedText || '이미지 설명'}](https://example.com/image.jpg)`;
          newCursorPos = start + (selectedText ? selectedText.length + 4 : 4);
          break;
        case 'list':
          insertText = `- ${selectedText || '항목'}`;
          newCursorPos = start + 2;
          break;
        case 'quote':
          insertText = `> ${selectedText || '인용문'}`;
          newCursorPos = start + 2;
          break;
        case 'table':
          insertText = `| 열1 | 열2 |\n|---|---|\n| ${selectedText || '데이터'} | 데이터 |`;
          newCursorPos = start + 2;
          break;
        case 'checklist':
          insertText = `- [ ] ${selectedText || '항목'}`;
          newCursorPos = start + 6;
          break;
        case 'hr':
          insertText = `---`;
          newCursorPos = start + 3;
          break;
      }

      this.form.content =
        this.form.content.slice(0, start) +
        insertText +
        this.form.content.slice(end);
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    async uploadImage(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.message = '이미지 업로드 중...';
      this.messageType = 'info';

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await this.$supabase.storage
          .from('apidocsimgs')
          .upload(fileName, file);

        if (uploadError) {
          console.error('업로드 오류:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = this.$supabase.storage
          .from('apidocsimgs')
          .getPublicUrl(fileName);

        if (!urlData.publicUrl) {
          throw new Error('공개 URL을 가져오지 못했습니다.');
        }

        this.form.image_url = urlData.publicUrl;
        this.message = '이미지 업로드 성공!';
        this.messageType = 'success';
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        this.message = `이미지 업로드 실패: ${error.message}`;
        this.messageType = 'error';
      } finally {
        this.uploading = false;
        setTimeout(() => {
          this.message = '';
          this.messageType = '';
        }, 3000);
      }
    },
    async submitPost() {
      try {
        const postData = {
          type: this.form.type,
          title: this.form.title,
          content: this.form.content,
          image_url: this.form.image_url || null,
          font_cdn: this.form.type === 'Fonts' ? this.form.font_cdn || null : null,
          is_free_font: this.form.type === 'Fonts' ? this.form.is_free_font : null,
        };

        const { data, error } = await this.$supabase
          .from('api_posts')
          .insert([postData])
          .select();

        if (error) {
          console.error('게시글 저장 오류:', error);
          this.message = `게시글 저장 실패: ${error.message}`;
          this.messageType = 'error';
          return;
        }

        console.log('게시글 저장 성공:', data);
        this.message = '게시글이 성공적으로 저장되었습니다!';
        this.messageType = 'success';

        this.form = {
          type: 'API',
          title: '',
          image_url: '',
          content: '',
          font_cdn: '',
          is_free_font: false,
        };

        setTimeout(() => {
          this.message = '';
          this.messageType = '';
          this.router.back();
        }, 3000);
      } catch (err) {
        console.error('게시글 저장 중 예기치 않은 오류:', err);
        this.message = '게시글 저장 중 오류가 발생했습니다.';
        this.messageType = 'error';
      }
    },
  },
};
</script>

<style scoped>
.write-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #242424;
  border-radius: 6px;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.8rem;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #fff;
}

.close-btn:hover {
  color: #d73a49;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #fff;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input[type="file"] {
  padding: 0.2rem;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.form-group textarea {
  resize: vertical;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toolbar button {
  padding: 0.5rem 1rem;
  background-color: #e1e4e8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2f363d;
}

.toolbar button:hover {
  background-color: #d0d7de;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.submit-btn:hover {
  background-color: #218838;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.message.info {
  background-color: #d1ecf1;
  color: #0c5460;
}
</style>