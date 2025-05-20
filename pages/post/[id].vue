<template>
  <div v-if="post">
    <div
      class="post-header"
      :style="post.image_url ? { backgroundImage: `url(${post.image_url})` } : {}"
    >
      <div class="text-back"></div>
      <h1>{{ post.title }}</h1>
      <button v-if="isAuthenticated" class="edit-btn" @click="toggleEditMode">수정</button>
    </div>
    <div class="post-content markdown-body" v-if="!isEditing" v-html="parseMarkdown(post.content)"></div>
    <div class="edit-form" v-else>
      <div class="form-group">
        <label for="edit-title">제목</label>
        <input
          id="edit-title"
          v-model="editForm.title"
          type="text"
          placeholder="게시글 제목을 입력하세요"
          required
        />
      </div>
      <div class="form-group">
        <label for="edit-content">본문 내용 (Markdown)</label>
        <textarea
          id="edit-content"
          v-model="editForm.content"
          placeholder="Markdown 형식으로 내용을 입력하세요"
          rows="10"
          required
        ></textarea>
      </div>
      <div class="form-actions">
        <button class="submit-btn" @click="saveChanges" :disabled="saving">저장</button>
        <button class="cancel-btn" @click="cancelEdit">취소</button>
      </div>
      <p v-if="error" class="error-message">{{ error.message }}</p>
    </div>
  </div>
  <div v-else-if="error">
    <p>오류 발생: {{ error.message }}</p>
  </div>
  <div v-else>
    <p>게시글을 불러오는 중...</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      post: null,
      error: null,
      isEditing: false,
      isAuthenticated: false, // 로그인 상태를 저장하는 변수
      editForm: {
        title: '',
        content: '',
      },
      saving: false,
    };
  },
  methods: {
    parseMarkdown(content) {
      if (!content) return '';

      const lines = content.split('\n');
      let html = '';
      let inCodeBlock = false;
      let inTable = false;
      let inList = false;
      let inChecklist = false;
      let inQuote = false;

      lines.forEach((line) => {
        if (!line.trim() && !inCodeBlock) {
          if (inList) html += '</ul>';
          if (inChecklist) html += '</ul>';
          if (inQuote) html += '</blockquote>';
          inList = false;
          inChecklist = false;
          inQuote = false;
          return;
        }

        if (line.trim().startsWith('```')) {
          if (inCodeBlock) {
            html += '</code></pre>';
            inCodeBlock = false;
          } else {
            html += '<pre><code class="code-block">';
            inCodeBlock = true;
          }
          return;
        }
        if (inCodeBlock) {
          html += `${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
          return;
        }

        if (line.trim().startsWith('|')) {
          if (!inTable) {
            html += '<table><thead><tr>';
            const headers = line.split('|').map(h => h.trim()).filter(h => h);
            headers.forEach(header => {
              html += `<th>${this.applyInlineStyles(header)}</th>`;
            });
            html += '</tr></thead><tbody>';
            inTable = true;
          } else if (line.trim().match(/^\|[-|\s:]+$/)) {
            return;
          } else {
            html += '<tr>';
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            cells.forEach(cell => {
              html += `<td>${this.applyInlineStyles(cell)}</td>`;
            });
            html += '</tr>';
          }
          return;
        } else if (inTable) {
          html += '</tbody></table>';
          inTable = false;
        }

        if (line.trim() === '---') {
          html += '<hr>';
          return;
        }

        if (line.trim().startsWith('>')) {
          if (!inQuote) {
            html += '<blockquote>';
            inQuote = true;
          }
          let text = line.slice(1).trim();
          text = this.applyInlineStyles(text);
          html += `<p>${text}</p>`;
          return;
        } else if (inQuote) {
          html += '</blockquote>';
          inQuote = false;
        }

        if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
          if (!inChecklist) {
            html += '<ul>';
            inChecklist = true;
          }
          const isChecked = line.trim().startsWith('- [x]');
          const text = this.applyInlineStyles(line.slice(5).trim());
          html += `<li><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}</li>`;
          return;
        } else if (inChecklist) {
          html += '</ul>';
          inChecklist = false;
        }

        if (line.trim().startsWith('- ')) {
          if (!inList) {
            html += '<ul>';
            inList = true;
          }
          const text = this.applyInlineStyles(line.slice(2).trim());
          html += `<li>${text}</li>`;
          return;
        } else if (inList) {
          html += '</ul>';
          inList = false;
        }

        if (line.startsWith('###')) {
          html += `<h3>${this.applyInlineStyles(line.slice(3).trim())}</h3>`;
        } else if (line.startsWith('##')) {
          html += `<h2>${this.applyInlineStyles(line.slice(2).trim())}</h2>`;
        } else if (line.startsWith('#')) {
          html += `<h1>${this.applyInlineStyles(line.slice(1).trim())}</h1>`;
        } else if (line.trim()) {
          let text = this.applyInlineStyles(line.trim());
          html += `<p>${text}</p>`;
        }
      });

      if (inCodeBlock) html += '</code></pre>';
      if (inTable) html += '</tbody></table>';
      if (inList) html += '</ul>';
      if (inChecklist) html += '</ul>';
      if (inQuote) html += '</blockquote>';

      console.log('Parsed Markdown HTML:', html);
      return html;
    },
    applyInlineStyles(text) {
      // 링크 처리 ([텍스트](URL))
      text = text.replace(/$$ ([^ $$]*)\]$$ ([^)]+) $$/g, '<a href="$2">$1</a>');
      // 이미지 처리 (![설명](URL))
      text = text.replace(/!$$ ([^ $$]*)\]$$ ([^)]+) $$/g, '<img src="$2" alt="$1">');
      // 굵은 글씨 (**text**)
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // 기울임 (*text*)
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // 인라인 코드 (`text`)
      text = text.replace(/`(.*?)`/g, '<code>$1</code>');
      return text;
    },
    toggleEditMode() {
      this.isEditing = !this.isEditing;
      if (this.isEditing) {
        this.editForm.title = this.post.title;
        this.editForm.content = this.post.content;
      }
    },
    async saveChanges() {
      if (!this.editForm.title.trim() || !this.editForm.content.trim()) {
        this.error = { message: '제목과 본문은 필수입니다.' };
        return;
      }

      this.saving = true;
      this.error = null;

      try {
        const { error } = await this.$supabase
          .from('api_posts')
          .update({
            title: this.editForm.title,
            content: this.editForm.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.post.id);

        if (error) {
          throw error;
        }

        this.post.title = this.editForm.title;
        this.post.content = this.editForm.content;
        this.isEditing = false;
      } catch (err) {
        console.error('Error updating post:', err);
        this.error = { message: `수정 실패: ${err.message}` };
      } finally {
        this.saving = false;
      }
    },
    cancelEdit() {
      this.isEditing = false;
      this.error = null;
      this.editForm.title = '';
      this.editForm.content = '';
    },
    async checkAuth() {
      try {
        const { data: { user } } = await this.$supabase.auth.getUser();
        this.isAuthenticated = !!user;
      } catch (err) {
        console.error('Error checking auth:', err);
        this.isAuthenticated = false;
      }
    },
  },
  async mounted() {
    await this.checkAuth(); // 로그인 상태 확인

    const id = this.$route.params.id;
    console.log('Fetching post with ID:', id);
    const { data, error } = await this.$supabase.from('api_posts').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching post:', error);
      this.error = error;
    } else {
      console.log('Fetched post:', data);
      this.post = data;
    }

    this.$nextTick(() => {
      const markdownBody = document.querySelector('.markdown-body pre');
      if (markdownBody) {
        const computedStyles = window.getComputedStyle(markdownBody);
        console.log('Computed styles for .markdown-body pre:', {
          backgroundColor: computedStyles.backgroundColor,
          color: computedStyles.color,
          padding: computedStyles.padding,
          fontFamily: computedStyles.fontFamily,
        });
      } else {
        console.log('No .markdown-body pre elements found in DOM');
      }
    });
  },
};
</script>

<style>
.markdown-body {
  line-height: 1.6;
}

.markdown-body h1 {
  font-size: 2em;
  margin: 0.67em 0;
}

.markdown-body h2 {
  font-size: 1.5em;
  margin: 0.75em 0;
}

.markdown-body h3 {
  font-size: 1.25em;
  margin: 0.83em 0;
}

.markdown-body p {
  margin: 1em 0;
}

.markdown-body strong {
  font-weight: bold;
}

.markdown-body em {
  font-style: italic;
}

.markdown-body code {
  background-color: #f6f8fa !important;
  padding: 0.2em 0.4em !important;
  border-radius: 3px !important;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace !important;
}

.markdown-body pre {
  background-color: #2d2d2d !important;
  color: #ffffff !important;
  padding: 1em !important;
  border-radius: 6px !important;
  overflow: auto !important;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace !important;
  margin: 1em 0 !important;
}

.markdown-body pre code.code-block {
  background: none !important;
  padding: 0 !important;
  color: inherit !important;
}

.markdown-body ul {
  list-style: disc;
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-body li {
  margin: 0.5em 0;
}

.markdown-body a {
  color: #0366d6 !important;
  text-decoration: none !important;
}

.markdown-body a:hover {
  text-decoration: underline !important;
}

.markdown-body img {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 1em 0 !important;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5 !important;
  padding: 0 1em !important;
  color: #6a737d !important;
  margin: 1em 0 !important;
}

.markdown-body table {
  border-collapse: collapse !important;
  width: 100% !important;
  margin: 1em 0 !important;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid #dfe2e5 !important;
  padding: 0.5em !important;
}

.markdown-body th {
  background-color: #f6f8fa !important;
  font-weight: bold !important;
}

.markdown-body input[type="checkbox"] {
  margin-right: 0.5em !important;
  vertical-align: middle !important;
}

.markdown-body hr {
  border: 0 !important;
  border-top: 1px solid #dfe2e5 !important;
  margin: 1em 0 !important;
}

.text-back {
  width: 100%;
  height: 100%;
  position: absolute;
  background: #0000006b;
  z-index: 0;
}

.post-header {
  position: relative;
  height: 300px;
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-shadow: 0 0 5px black;
}

.post-header h1 {
  margin: 0;
  font-size: 2.5rem;
  z-index: 2;
}

.post-content {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #2f363d;
}

.edit-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 0.5rem 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  z-index: 2;
}

.edit-btn:hover {
  background-color: #218838;
}

.edit-form {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2f363d;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
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

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
}
</style>