<template>
  <div class="container">
    <!-- 좌측: 코드 에디터 영역 -->
    <div class="panel left-panel">
      <!-- HTML / CSS / JS 탭 -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ 'active-tab': activeTab === 'html' }"
          @click="activeTab = 'html'"
        >
          HTML
        </button>
        <button
          class="tab"
          :class="{ 'active-tab': activeTab === 'css' }"
          @click="activeTab = 'css'"
        >
          CSS
        </button>
        <button
          class="tab"
          :class="{ 'active-tab': activeTab === 'js' }"
          @click="activeTab = 'js'"
        >
          JS
        </button>
      </div>
      <!-- 에디터 컨테이너 -->
      <div class="editor-frame">
        <!-- HTML 에디터 -->
        <div ref="editorHtml" v-show="activeTab === 'html'" class="editor"></div>
        <!-- CSS 에디터 -->
        <div ref="editorCss" v-show="activeTab === 'css'" class="editor"></div>
        <!-- JS 에디터 -->
        <div ref="editorJs" v-show="activeTab === 'js'" class="editor"></div>
      </div>
    </div>

    <!-- 우측: 프리뷰 & 게시물 영역 -->
    <div class="panel right-panel">
      <!-- 프리뷰 / 게시물 탭 -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ 'active-tab': previewTab === 'preview' }"
          @click="previewTab = 'preview'"
        >
          프리뷰
        </button>
        <button
          class="tab"
          :class="{ 'active-tab': previewTab === 'posts' }"
          @click="previewTab = 'posts'"
        >
          게시물
        </button>
      </div>
      <div class="editor-frame">
        <!-- 실시간 프리뷰 iframe -->
        <iframe
          v-show="previewTab === 'preview'"
          ref="previewFrame"
          class="preview-iframe"
        ></iframe>

        <!-- 게시물 리스트 및 내용 -->
        <div v-show="previewTab === 'posts'" class="posts-container">
          <!-- 좌측: 게시판 목록 -->
          <div class="posts-list">
            <h3>Library 게시판</h3>
            <ul>
              <li
                v-for="post in libraryPosts"
                :key="post.id"
                class="post-item"
                @click="selectPost(post.id)"
              >
                {{ post.title }}
              </li>
            </ul>
            <h3>Framework 게시판</h3>
            <ul>
              <li
                v-for="post in frameworkPosts"
                :key="post.id"
                class="post-item"
                @click="selectPost(post.id)"
              >
                {{ post.title }}
              </li>
            </ul>
          </div>
          <!-- 우측: 선택된 게시물 내용 -->
          <div class="post-content">
            <div v-if="selectedPost">
              <h2>{{ selectedPost.title }}</h2>
              <div v-html="selectedPost.content"></div>
            </div>
            <div v-else class="no-post-message">
              게시물을 선택해주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const config = useRuntimeConfig()
const supabase = createClient(
  config.public.supabaseUrl,
  config.public.supabaseAnonKey
)

// Monaco Editor 변수
let monaco = null

// 에디터 DOM 참조
const editorHtml = ref(null)
const editorCss = ref(null)
const editorJs = ref(null)

// Monaco Editor 인스턴스 저장 객체
const editors = {
  html: null,
  css: null,
  js: null,
}

// 기본 코드 내용
const htmlCode = ref(`
<!-- HTML 코드를 여기에 작성하세요 -->
<div id="app">
  <h1>Hello, Live Edit!</h1>
</div>
`)
const cssCode = ref(`
/* CSS 코드를 여기에 작성하세요 */
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin-top: 50px;
}
`)
const jsCode = ref(`
// JS 코드를 여기에 작성하세요
console.log('Live Edit 시작!');
`)

// 현재 활성 탭 (html, css, js)
const activeTab = ref('html')
// 프리뷰 vs 게시물 탭
const previewTab = ref('preview')

// Supabase에서 분리된 게시물 목록 (Library / Framework)
const libraryPosts = ref([])
const frameworkPosts = ref([])

// 현재 선택된 게시물 데이터
const selectedPost = ref(null)

// iframe 참조
const previewFrame = ref(null)

// Supabase에서 라이브러리/프레임워크 게시물 불러오기
async function fetchPosts() {
  // api_posts 테이블에서 type='API' & is_framework=false (Library)
  const { data: libs, error: libsError } = await supabase
    .from('api_posts')
    .select('id,title')
    .eq('type', 'API')
    .eq('is_framework', false)
    .order('id', { ascending: false })
  if (libsError) {
    console.error('Library 게시물 조회 오류:', libsError)
  } else {
    libraryPosts.value = libs
  }

  // api_posts 테이블에서 type='API' & is_framework=true (Framework)
  const { data: frs, error: frsError } = await supabase
    .from('api_posts')
    .select('id,title')
    .eq('type', 'API')
    .eq('is_framework', true)
    .order('id', { ascending: false })
  if (frsError) {
    console.error('Framework 게시물 조회 오류:', frsError)
  } else {
    frameworkPosts.value = frs
  }
}

// 게시물 클릭 시 상세 내용 가져오기
async function selectPost(postId) {
  // api_posts 테이블에서 id에 해당하는 행 조회
  const { data, error } = await supabase
    .from('api_posts')
    .select('title,content')
    .eq('id', postId)
    .single()
  if (error) {
    console.error('게시물 상세 조회 오류:', error)
    selectedPost.value = null
  } else {
    selectedPost.value = {
      title: data.title,
      content: data.content,
    }
  }
}

// iframe에 코드 반영 함수
function updatePreview() {
  const doc =
    previewFrame.value.contentDocument ||
    previewFrame.value.contentWindow.document
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- 외부 라이브러리 CDN 삽입 시 HTML에 직접 추가하세요 -->
  <style>
${cssCode.value}
  </style>
</head>
<body>
${htmlCode.value}
  <script>
${jsCode.value}
  <\/script>
</body>
</html>
`
  doc.open()
  doc.write(fullHtml)
  doc.close()
}

onMounted(async () => {
  // 1. Supabase에서 게시물 목록 가져오기
  await fetchPosts()

  // 2. MonacoEnvironment.getWorker 함수 정의 (Vite 환경 워커 경로)
  if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === 'json') {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/language/json/json.worker',
              import.meta.url
            ),
            { type: 'module' }
          )
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/language/css/css.worker',
              import.meta.url
            ),
            { type: 'module' }
          )
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/language/html/html.worker',
              import.meta.url
            ),
            { type: 'module' }
          )
        }
        if (label === 'typescript' || label === 'javascript') {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/language/typescript/ts.worker',
              import.meta.url
            ),
            { type: 'module' }
          )
        }
        // 기본 에디터 워커
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/editor/editor.worker',
            import.meta.url
          ),
          { type: 'module' }
        )
      },
    }
  }

  // 3. Monaco Editor ESM API 동적 로드
  monaco = await import('monaco-editor/esm/vs/editor/editor.api')

  // 4. HTML, CSS, JS 에디터 인스턴스 생성
  editors.html = monaco.editor.create(editorHtml.value, {
    language: 'html',
    value: htmlCode.value.trim(),
    automaticLayout: true,
    theme: 'vs-light',
  })
  editors.css = monaco.editor.create(editorCss.value, {
    language: 'css',
    value: cssCode.value.trim(),
    automaticLayout: true,
    theme: 'vs-light',
  })
  editors.js = monaco.editor.create(editorJs.value, {
    language: 'javascript',
    value: jsCode.value.trim(),
    automaticLayout: true,
    theme: 'vs-light',
  })

  // 5. 에디터 내용 변경 시 ref에 동기화
  editors.html.onDidChangeModelContent(() => {
    htmlCode.value = editors.html.getValue()
  })
  editors.css.onDidChangeModelContent(() => {
    cssCode.value = editors.css.getValue()
  })
  editors.js.onDidChangeModelContent(() => {
    jsCode.value = editors.js.getValue()
  })

  // 6. 초기 프리뷰 렌더링
  updatePreview()
})

// 코드나 탭 전환 시 프리뷰 갱신
watch([htmlCode, cssCode, jsCode, previewTab], () => {
  if (previewTab.value === 'preview') {
    updatePreview()
  }
})
</script>

<style>
/* 컨테이너: 화면 전체를 flex로 좌우 분할 */
.container {
  display: flex;
  height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 패널 설정 */
.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

/* 좌측과 우측 패널 각각 테두리 조정 */
.left-panel {
  border-right: none;
}

.right-panel {
  border-left: none;
}

/* 탭 바 */
.tabs {
  display: flex;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
}

/* 탭 버튼 공통 스타일 */
.tab {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

/* 활성 탭 강조 */
.active-tab {
  border-bottom: 3px solid #007acc;
  font-weight: bold;
  color: #007acc;
}

/* 에디터 & 프리뷰 영역 */
.editor-frame {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* Monaco Editor 컨테이너 */
.editor {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* 프리뷰 iframe 스타일 */
.preview-iframe {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background-color: #fff;
}

/* 게시물 목록 및 내용 레이아웃 */
.posts-container {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 게시판 리스트 (좌측) */
.posts-list {
  width: 33.33%;
  border-right: 1px solid #ccc;
  padding: 16px;
  overflow-y: auto;
  box-sizing: border-box;
}

.posts-list h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.posts-list ul {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.post-item {
  padding: 6px 0;
  cursor: pointer;
  color: #555;
}

.post-item:hover {
  color: #007acc;
}

/* 게시물 내용 (우측) */
.post-content {
  width: 66.67%;
  padding: 16px;
  overflow-y: auto;
  box-sizing: border-box;
}

.post-content h2 {
  margin-top: 0;
  font-size: 20px;
  color: #222;
}

.no-post-message {
  color: #888;
  font-size: 14px;
  text-align: center;
  margin-top: 20px;
}

/* html, body 기본 스타일 초기화 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
