// script.js

// Marked.js ライブラリは HTML で <script> タグで読み込んでいるため、marked.parse() などがグローバルに利用可能
// MathJax ライブラリも HTML で <script> タグで読み込んでいるため、MathJax オブジェクトがグローバルに利用可能


// TODO: 初期表示したい記事のMarkdownファイルのパスを記述してください
let currentArticleUrl = null; // 初期表示するMarkdownファイルのパス

// Markdownコンテンツを表示する領域（以前のPDF表示領域を再利用）
const markdownViewer = document.getElementById('pdf-viewer'); // IDはそのまま使用

// 記事一覧リストを表示する要素
const articleListElement = document.getElementById('article-list');


// 日付文字列 (例: "YYYY-MM-DD") を "Month Day<suffix>,YYYY" 形式に整形する関数
// 例: "2025-06-27" -> "June 27th, 2025"
function formatDate(dateString) {
    if (!dateString) return ''; // 日付文字列がない場合は空を返す

    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // 無効な日付の場合
        console.error("Invalid date string:", dateString);
        return dateString; // 元の文字列を返すか、エラー表示など
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    // Date.toLocaleDateString を使って "Month Day,YYYY" の形式を取得 (例: "June 27, 2025")
    const formattedDate = date.toLocaleDateString('en-US', options);

    // 日付の部分に序数詞 (-st, -nd, -rd, -th) を追加
    const parts = formattedDate.split(' ');
    const day = parseInt(parts[1].replace(',', '')); // 日付の数字を取得 (例: 27)
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) {
        suffix = 'st';
    } else if (day === 2 || day === 22) {
        suffix = 'nd';
    } else if (day === 3 || day === 23) {
        suffix = 'rd';
    }
    parts[1] = day + suffix + ','; // 日付に序数詞とコンマを追加

    return parts.join(' '); // 整形された日付文字列を返す
}

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
        const htmlContent = marked.parse(markdownText); // Marked.js 4.0.0 以降は parse() を推奨

        // 変換したHTMLをMarkdown表示領域に表示
        markdownViewer.innerHTML = htmlContent;

        // ★★★ 追加：MathJax に、新しく表示されたコンテンツの数式をレンダリングさせる ★★★
        // Marked.js で変換された HTML が DOM に追加された後に MathJax を実行します。
        // MathJax.typesetPromise() は非同期でレンダリングを行い、完了を Promise で返します。
        // #pdf-viewer (markdownViewer) 要素内の数式をレンダリング対象とします。
        // MathJax は HTML で <script> タグで読み込んでいるため、window.MathJax として利用可能
        if (window.MathJax) { // MathJax が読み込まれているかチェック
             await MathJax.typesetPromise([markdownViewer]); // markdownViewer 要素内の数式をレンダリング
        } else {
             // MathJax がまだ読み込まれていない場合やエラーの場合
             console.warn("MathJax is not loaded. 数式が表示されない可能性があります。");
             // 必要であれば、MathJax の読み込み完了を待つか、代替処理を実装することも考えられます
             // 例：MathJax が読み込まれたら一度だけ typeset を実行するイベントリスナーを設定するなど
        }
        // ★★★ 追加終わり ★★★


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
            const link = document.createElement('a'); // 記事タイトルリンク
            const metaInfoContainer = document.createElement('div'); // 日付とタグを囲むコンテナ
            metaInfoContainer.classList.add('meta-info');

            const dateElement = document.createElement('p'); // 日付表示用の要素
            const tagsContainer = document.createElement('div'); // タグ表示用のコンテナ
            tagsContainer.classList.add('article-tags');

            // リンク先を記事IDに（JavaScriptで制御するため実質ダミー）
            link.href = `#${article.id}`;
            link.textContent = article.title; // リンクのテキストを記事タイトルに

            // 記事データに date プロパティがあれば、日付を整形して要素に設定
            if (article.date) {
                 dateElement.textContent = formatDate(article.date); // 整形関数を使用
                 dateElement.classList.add('article-date'); // スタイルのためのクラスを追加
            }

            // タグデータがあれば、ループで各タグ要素を生成してコンテナに追加
            if (article.tags && Array.isArray(article.tags)) {
                 article.tags.forEach(tagText => {
                     const tagElement = document.createElement('span'); // タグ一つ一つを表示する要素 (span を使用)
                     tagElement.textContent = tagText; // タグのテキスト
                     tagElement.classList.add('article-tag'); // スタイルのためのクラスを追加
                     tagsContainer.appendChild(tagElement); // タグコンテナに追加
                 });
            }


            // クリックイベントリスナーを追加
            link.addEventListener('click', (event) => {
                event.preventDefault(); // デフォルトのリンク遷移（ページ内ジャンプなど）を防ぐ
                console.log(`記事タイトル「${article.title}」がクリックされました。対応ファイル: ${article.filename}`);

                // クリックされた記事のMarkdownを表示
                renderMarkdown(article.filename);

                // Optional: アクティブなリンクにスタイルを適用
                // 現在アクティブなリンクからクラスを削除
                if (document.querySelector('#article-list .active')) {
                    document.querySelector('#article-list .active').classList.remove('active');
                }
                // クリックされたリンクにアクティブクラスを追加
                event.target.classList.add('active');

                // Optional: モバイル表示でメニューを閉じるなどの処理をここに追加することも考えられます
            });


            // 日付データがある場合、またはタグデータがある場合のみ、このメタ情報コンテナを追加
            if (article.date || (article.tags && article.tags.length > 0)) {
                 if (article.date) {
                     metaInfoContainer.appendChild(dateElement); // 日付要素をコンテナに追加
                 }
                 if (article.tags && article.tags.length > 0) {
                     metaInfoContainer.appendChild(tagsContainer); // タグコンテナをコンテナに追加
                 }
                listItem.appendChild(metaInfoContainer); // コンテナをリスト項目に追加
            }

            // リスト項目にタイトルリンクを追加
            listItem.appendChild(link);

            articleListElement.appendChild(listItem); // 生成したリスト項目を記事一覧に追加

        });

        // 初期表示する記事の制御（変更なし）
        // ページ読み込み時、記事一覧が読み込まれた後に実行
        if (currentArticleUrl) {
             const initialArticle = articles.find(article => article.filename === currentArticleUrl);
             if (initialArticle) {
                renderMarkdown(currentArticleUrl);
                 const initialLink = articleListElement.querySelector(`a[href="#${initialArticle.id}"]`);
                 if (initialLink) {
                     initialLink.classList.add('active');
                 }
             } else if (articles.length > 0) {
                 currentArticleUrl = articles[0].filename;
                 renderMarkdown(currentArticleUrl);
                  const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
                  if (initialLink) {
                     initialLink.classList.add('active');
                  }
             } else {
                  markdownViewer.innerHTML = '<p>記事がまだありません。</p>';
             }
        } else if (articles.length > 0) {
             currentArticleUrl = articles[0].filename;
             renderMarkdown(currentArticleUrl);
              const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
              if (initialLink) {
                 initialLink.classList.add('active');
              }
        } else {
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
