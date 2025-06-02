<template>
  <div v-if="post">
    <div
      class="post-header"
      :style="post.image_url ? { backgroundImage: `url(${post.image_url})` } : {}"
    >
      <div class="text-back"></div>
      <h1>{{ post.title }}</h1>
      <button class="request-edit-btn" @click="openRequestModal">Request</button>
      <button v-if="post.npm_command" class="add-npm-btn" @click="addToCart()"> Add Npm </button>
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
      <div v-if="language === 'KO'" v-html="parseMarkdown(post.content)"></div>
      <div v-else-if="enContent" v-html="parseMarkdown(enContent)"></div>
      <div v-else class="no-translation">
        <img src="/assets/css/404.png" alt="No-translation" />
        <p>Translation in progress. We will upload the translation as soon as possible. Sorry for the inconvenience.</p>
      </div>
    </div>
    <div class="bottom-margin"></div>
  </div>
  <div v-else-if="error">
    <p>오류 발생: {{ error.message }}</p>
  </div>
  <div v-else>
    <p>게시글을 불러오는 중...</p>
  </div>

  <div v-if="showRequestModal" class="modal-overlay" @click.self="closeRequestModal">
    <div class="modal-content">
      <button class="close-btn" @click="closeRequestModal">×</button>
      <div class="request-form">
        <h2>Request</h2>
        <div class="form-group">
          <label for="request-title">제목</label>
          <input
            id="request-title"
            v-model="requestForm.title"
            type="text"
            placeholder="수정 요청 제목을 입력하세요"
            required
          />
        </div>
        <div class="form-group">
          <label for="request-content">본문 내용 (Markdown형태 가능)</label>
          <textarea
            id="request-content"
            v-model="requestForm.content"
            placeholder="요청사항을 입력하세요.
수정 요청의 경우, 해당 게시글 제목을 알려주세요.
자료 추가 요청의 경우, 공식 문서의 URL을 Markdown URL 형태로 입력해 주세요."
            rows="10"
            required
          ></textarea>
        </div>
        <div class="form-actions">
          <button class="submit-btn" @click="submitRequest" :disabled="saving">요청 제출</button>
          <button class="cancel-btn" @click="closeRequestModal">취소</button>
        </div>
        <p v-if="error" class="error-message">{{ error.message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

export default {
  inject: ['addLibrary'],
  data() {
    return {
      post: null,
      enContent: null,
      error: null,
      showRequestModal: false,
      requestForm: {
        title: '',
        content: '',
      },
      saving: false,
      language: 'KO',
      loading: false,
    };
  },
  watch: {
    language(newLang) {
      if (newLang === 'EN') {
        this.fetchEnContent();
      } else {
        this.enContent = null;
      }
    },
  },
  methods: {
    async fetchEnContent() {
      this.loading = true;
      const { data, error } = await this.$supabase
        .from('api_posts_en')
        .select('content')
        .eq('post_id', this.post.id)
        .single();
      this.loading = false;
      if (error) {
        console.error('Error fetching English content:', error);
        this.enContent = null;
      } else {
        this.enContent = data ? data.content : null;
      }
    },
    parseMarkdown(content) {
      if (!content) return '';

      const lines = content.split('\n');
      let html = '';
      let inCodeBlock = false;
      let inTable = false;
      let inList = false;
      let inChecklist = false;
      let inQuote = false;
      let codeBlockLines = [];
      let codeLanguage = '';

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
            const code = codeBlockLines.join('\n');
            const highlightedCode = codeLanguage
              ? hljs.highlight(code, { language: codeLanguage }).value
              : hljs.highlightAuto(code).value;
            html += `<pre><code class="hljs">${highlightedCode}</code></pre>`;
            inCodeBlock = false;
            codeBlockLines = [];
            codeLanguage = '';
          } else {
            const language = line.trim().slice(3).trim();
            codeLanguage = language || '';
            inCodeBlock = true;
          }
          return;
        }
        if (inCodeBlock) {
          codeBlockLines.push(line);
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

      if (inCodeBlock) {
        const code = codeBlockLines.join('\n');
        const highlightedCode = codeLanguage
          ? hljs.highlight(code, { language: codeLanguage }).value
          : hljs.highlightAuto(code).value;
        html += `<pre><code class="hljs">${highlightedCode}</code></pre>`;
      }
      if (inTable) html += '</tbody></table>';
      if (inList) html += '</ul>';
      if (inChecklist) html += '</ul>';
      if (inQuote) html += '</blockquote>';

      return html;
    },
    applyInlineStyles(text) {
      text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
      text = text.replace(/!$$ ([^ $$]*)\]$$ ([^)]+) $$/g, '<img src="$2" alt="$1">');
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/`(.*?)`/g, '<code>$1</code>');
      return text;
    },
    openRequestModal() {
      this.showRequestModal = true;
      this.requestForm.title = '';
      this.requestForm.content = '';
    },
    closeRequestModal() {
      this.showRequestModal = false;
      this.error = null;
    },
    async submitRequest() {
      if (!this.requestForm.title.trim() || !this.requestForm.content.trim()) {
        this.error = { message: '제목과 본문은 필수입니다.' };
        return;
      }

      this.saving = true;
      this.error = null;

      try {
        const { error } = await this.$supabase
          .from('edit_requests')
          .insert({
            post_id: this.post.id,
            title: this.requestForm.title,
            content: this.requestForm.content,
            created_at: new Date().toISOString(),
          });

        if (error) {
          throw error;
        }

        this.closeRequestModal();
      } catch (err) {
        console.error('Error submitting request:', err);
        this.error = { message: `요청 제출 실패: ${err.message}` };
      } finally {
        this.saving = false;
      }
    },
    addToCart() {
      if (!this.post || !this.post.npm_command) return;

      this.addLibrary({
        title: this.post.title,
        npm_command: this.post.npm_command,
        docId: this.$route.params.id,
      });
    },
  },
  async mounted() {
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
  },
};
</script>

<style>
.markdown-body {
  line-height: 1.6;
  position: relative;
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
  background-color: #027a00 !important;
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

.markdown-body pre code.hljs {
  background: none !important;
  padding: 20px 0px !important;
  color: inherit !important;
}

pre code.hljs::-webkit-scrollbar {
  height: 10px;
}

pre code.hljs::-webkit-scrollbar-thumb {
  background-color: #2cdb43;
  border-radius: 10px;
  border: 4px solid #2cdb43;
}

pre code.hljs::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
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
  background: #000000bd;
  z-index: 0;
  border-bottom: solid 2px #fff;
}

.post-header {
  position: relative;
  height: 300px;
  background-size: auto;
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
  width: 80vw;
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #141414;
  border: 2px solid #2cdb43;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #fff;
}

.request-edit-btn {
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
  zinx: 2;
}

.request-edit-btn:hover {
  color: #2dc14d;
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
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: min(90vw, 600px);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.bottom-margin {
  width: 100vw;
  height: 30px;
}

.add-npm-btn {
  font-family: 'Super Guardian', sans-serif;
  position: absolute;
  bottom: 20px;
  right: 110px;
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


.custom_radio{
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.custom_radio span{
  font-weight: bold;
  margin-left: 6px;
}

.custom_radio [type="radio"]{
  appearance: none;
  margin:0px;
  padding:0px;
  box-sizing: border-box;
  border:2px solid #dcdcdc;
  border-radius: 250px;
  width:18px;
  height:18px;
  cursor: pointer;
}

.custom_radio [type="radio"]:checked{
  box-sizing: border-box;
  border:5px solid #2cdb43;
}

.custom_radio [type="radio"]:disabled{
  background-color: #dcdcdc;
}

.custom_radio [type="radio"]:disabled + span{
  color:#dcdcdc;
}

</style>