// script.js

// PDF.js 関連コードは削除
// import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
// let currentLoadingTask = null;
// const getDocument = pdfjsLib.getDocument;
// async function renderPdf(pdfUrl) { ... } // renderPdf 関数を削除

// TODO: 初期表示したい記事のMarkdownファイルのパスを記述してください
let currentArticleUrl = './blogs/sagawa_semantic_space_human_ai.md'; // 初期表示するMarkdownファイルのパス

// Markdownコンテンツを表示する領域（以前のPDF表示領域を再利用）
const markdownViewer = document.getElementById('pdf-viewer'); // IDはそのまま使用

// 記事一覧リストを表示する要素
const articleListElement = document.getElementById('article-list');


// Markdownファイルを読み込み、HTMLに変換して表示する関数
async function renderMarkdown(markdownUrl) {
    // 以前の表示内容をクリアし、読み込み中のメッセージを表示
    markdownViewer.innerHTML = '<p>読み込み中...</p>';

    try {
        // Markdownファイルの内容をテキストとして読み込み
        const response = await fetch(markdownUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdownText = await response.text();

        // Marked.js を使って Markdown を HTML に変換
        // marked() 関数は HTML の <script> タグで読み込んでいるため、グローバルに利用可能
        const htmlContent = marked.parse(markdownText); // marked.parse() を使用

        // 変換したHTMLをMarkdown表示領域に表示
        markdownViewer.innerHTML = htmlContent;

    } catch (error) {
        console.error('Markdownファイルの読み込みまたは変換中にエラーが発生しました:', error);
        markdownViewer.innerHTML = '<p>記事の読み込みに失敗しました。ファイルが存在するか確認してください。</p>';
    }
}


// 記事一覧データを読み込み、リストを表示する関数
async function loadArticleList() {
    try {
        // articles.json ファイルを読み込み
        const response = await fetch('./articles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const articles = await response.json(); // JSONとしてパース

        // 記事一覧リストをクリア
        articleListElement.innerHTML = '';

        // 記事データを元にリスト項目を生成
        articles.forEach(article => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');

            // リンク先を記事IDに（JavaScriptで制御するため実質ダミー）
            link.href = `#${article.id}`;
            link.textContent = article.title; // リンクのテキストを記事タイトルに

            // クリックイベントリスナーを追加
            link.addEventListener('click', (event) => {
                event.preventDefault(); // デフォルトのリンク遷移を防ぐ
                console.log(`記事タイトル「${article.title}」がクリックされました。対応ファイル: ${article.filename}`);

                // ★★★ クリックされた記事のMarkdownを表示 ★★★
                renderMarkdown(article.filename); // クリックされた記事のMarkdownファイルを renderMarkdown 関数に渡して表示

                // Optional: アクティブなリンクにスタイルを適用
                // 現在アクティブなリンクからクラスを削除
                if (document.querySelector('#article-list .active')) {
                    document.querySelector('#article-list .active').classList.remove('active');
                }
                // クリックされたリンクにアクティブクラスを追加
                event.target.classList.add('active');

            });

            listItem.appendChild(link);
            articleListElement.appendChild(listItem);
        });

         // ★★★ 初期表示する記事の制御 ★★★
        // ページ読み込み時、記事一覧が読み込まれた後に実行
        // もし currentArticleUrl が設定されていればその記事を表示
        // 設定されていなければ、記事リストの最初の記事を表示
        if (currentArticleUrl) {
             // currentArticleUrl に対応する記事が記事リストにあるか確認
             const initialArticle = articles.find(article => article.filename === currentArticleUrl);
             if (initialArticle) {
                renderMarkdown(currentArticleUrl);
                // 初期表示の記事リンクにアクティブクラスを付ける（Optional）
                 const initialLink = articleListElement.querySelector(`a[href="#${initialArticle.id}"]`);
                 if (initialLink) {
                     initialLink.classList.add('active');
                 }
             } else if (articles.length > 0) {
                 // 設定された初期URLの記事が見つからない場合、最初の記事を表示
                 currentArticleUrl = articles[0].filename;
                 renderMarkdown(currentArticleUrl);
                  const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
                  if (initialLink) {
                     initialLink.classList.add('active');
                  }
             } else {
                  // 記事が一つもない場合
                  markdownViewer.innerHTML = '<p>記事がまだありません。</p>';
             }
        } else if (articles.length > 0) {
             // 初期表示URLが設定されておらず、記事がある場合、最初の記事を表示
             currentArticleUrl = articles[0].filename;
             renderMarkdown(currentArticleUrl);
              const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
              if (initialLink) {
                 initialLink.classList.add('active');
              }
        } else {
             // 記事が一つもない場合
             markdownViewer.innerHTML = '<p>記事がまだありません。</p>';
        }


    } catch (error) {
        console.error('記事一覧の読み込み中にエラーが発生しました:', error);
        articleListElement.innerHTML = '<li>記事一覧の読み込みに失敗しました。articles.json ファイルを確認してください。</li>';
        markdownViewer.innerHTML = '<p>記事一覧の読み込みに失敗しました。</p>';
    }
}


// ページが全て読み込まれた後に実行
document.addEventListener('DOMContentLoaded', () => {
    // 記事一覧を読み込み・表示する関数を呼び出し
    loadArticleList();
});
