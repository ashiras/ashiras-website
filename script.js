// script.js

// Marked.js ライブラリは HTML で <script> タグで読み込んでいるため、marked.parse() などがグローバルに利用可能
// MathJax ライブラリも HTML で <script> タグで読み込んでいるため、MathJax オブジェクトがグローバルに利用可能


// TODO: URLクエリパラメータに id がない場合のデフォルトの初期表示記事パスを記述してください
// URLのIDで見つからず、かつここにパスが設定されていれば、その記事が表示されます。
// 特定のデフォルト初期表示がない場合は、null または空文字列にしてください。
// その場合、articles.json の最初の記事が自動的に表示されます。
let defaultInitialArticleUrl = './blogs/sagawa_semantic_space_human_ai.md';


// Markdownコンテンツを表示する領域（以前のPDF表示領域を再利用）
const markdownViewer = document.getElementById('pdf-viewer'); // IDはそのまま使用

// 記事一覧リストを表示する要素
const articleListElement = document.getElementById('article-list');

// 記事データの配列を保持する変数（articles.json から読み込まれる）
let allArticles = [];


// 日付文字列 (例: "YYYY-MM-DD") を "Month Day<suffix>,YYYY" 形式に整形する関数
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return dateString;
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const parts = formattedDate.split(' ');
    const day = parseInt(parts[1].replace(',', ''));
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) { suffix = 'st'; } else if (day === 2 || day === 22) { suffix = 'nd'; } else if (day === 3 || day === 23) { suffix = 'rd'; }
    parts[1] = day + suffix + ',';
    return parts.join(' ');
}


// ★★★ 修正：Markdownファイルを読み込み、HTMLに変換して表示する関数 ★★★
// 引数として、記事データオブジェクト全体を受け取るように変更
async function renderMarkdown(articleData) {
    // 以前の表示内容をクリアし、読み込み中のメッセージを表示
    markdownViewer.innerHTML = '<p>読み込み中...</p>';

    // ★★★ 追加：ページのタイトルとメタディスクリプションを書き換える ★★★
    // 表示している記事のタイトルと説明文を <head> のタグに反映
    // document.title で <title> タグの内容を書き換え
    document.title = `${articleData.title} - Ashiras, inc. ブログ`;

    // <meta name="description"> タグを取得し、content属性を書き換え
    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (metaDescriptionTag) { // タグが存在することを確認
         // description プロパティがなければ空文字列を設定
         metaDescriptionTag.setAttribute('content', articleData.description || '');
    }
    // ★★★ 追加終わり ★★★


    try {
        // Markdownファイルの内容をテキストとして読み込み（articleData.filename を使用）
        const response = await fetch(articleData.filename);
        if (!response.ok) {
            // ファイル読み込み失敗時のエラーメッセージ
            markdownViewer.innerHTML = `<p>記事の読み込みに失敗しました。ファイルが見つかりません: ${articleData.filename}</p>`;
            throw new Error(`HTTP error! status: ${response.status} for ${articleData.filename}`);
        }
        const markdownText = await response.text();

        // Marked.js を使って Markdown を HTML に変換
        const htmlContent = marked.parse(markdownText); // Marked.js 4.0.0 以降は parse() を推奨

        // 変換したHTMLをMarkdown表示領域に表示
        markdownViewer.innerHTML = htmlContent;

        // MathJax に、新しく表示されたコンテンツの数式をレンダリングさせる
        if (window.MathJax) {
             await MathJax.startup.promise; // MathJax のロード完了を待機
             await MathJax.typesetPromise([markdownViewer]); // markdownViewer 要素内の数式をレンダリング
        } else {
             console.warn("MathJax object is not globally available. Check if MathJax script is correctly loaded in HTML and initialized.");
        }

    } catch (error) {
        console.error('Markdownファイルの読み込みまたはレンダリング中にエラーが発生しました:', error);
        // エラーメッセージは fetch 失敗時に上で設定済み、ここではログ出力のみ
    }
}


// 記事一覧データを読み込み、リストを表示する関数
async function loadArticleList() {
    try {
        const response = await fetch('./articles.json');
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        allArticles = await response.json(); // 読み込んだ記事データを allArticles に保存

        articleListElement.innerHTML = '';

        allArticles.forEach(article => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            const metaInfoContainer = document.createElement('div');
            metaInfoContainer.classList.add('meta-info');
            const dateElement = document.createElement('p');
            const tagsContainer = document.createElement('div');
            tagsContainer.classList.add('article-tags');

            link.href = `#${article.id}`;
            link.textContent = article.title;

            if (article.date) { dateElement.textContent = formatDate(article.date); dateElement.classList.add('article-date'); }
            if (article.tags && Array.isArray(article.tags)) { article.tags.forEach(tagText => { const tagElement = document.createElement('span'); tagElement.textContent = tagText; tagElement.classList.add('article-tag'); tagsContainer.appendChild(tagElement); });}

            link.addEventListener('click', (event) => {
                event.preventDefault();
                console.log(`記事タイトル「${article.title}」がクリックされました。対応ファイル: ${article.filename}`);
                // ★修正：記事データオブジェクト全体を renderMarkdown に渡す ★
                renderMarkdown(article);

                if (document.querySelector('#article-list .active')) { document.querySelector('#article-list .active').classList.remove('active'); }
                event.target.classList.add('active');
            });

            if (article.date || (article.tags && Array.isArray(article.tags) && article.tags.length > 0)) {
                 if (article.date) { metaInfoContainer.appendChild(dateElement); }
                 if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) { metaInfoContainer.appendChild(tagsContainer); }
                listItem.appendChild(metaInfoContainer);
            }
            listItem.appendChild(link);
            articleListElement.appendChild(listItem);
        });

        // ★★★ 初期表示のロジックは loadInitialArticle 関数に分離 ★★★
        // 記事一覧の読み込みが完了したら、初期表示関数を呼び出す
        loadInitialArticle();


    } catch (error) {
        console.error('記事一覧の読み込み中にエラーが発生しました:', error);
        articleListElement.innerHTML = '<li>記事一覧の読み込みに失敗しました。articles.json ファイルを確認してください。</li>';
        markdownViewer.innerHTML = '<p>記事一覧の読み込みに失敗しました。</p>';
    }
}


// ★★★ 初期表示を実行する関数（修正） ★★★
async function loadInitialArticle() {
     // MathJax が完全にロードされるのを待ってから最初の記事を表示
    if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
         await MathJax.startup.promise; // MathJax のロード完了を待機
    } else {
         console.warn("MathJax startup promise is not available for initial render. Math rendering might not work initially.");
    }

    // ★★★ 修正：表示する記事を決定するロジック ★★★
    let articleToDisplay = null; // 表示する記事データオブジェクト

    // 1. URLのクエリパラメータに記事IDがあるかチェック
    const urlParams = new URLSearchParams(window.location.search);
    const articleIdFromUrl = urlParams.get('id');

    if (articleIdFromUrl) {
         // URLにIDがある場合、そのIDに一致する記事を articles から探す
         // allArticles は loadArticleList で読み込まれているはず
         articleToDisplay = allArticles.find(article => article.id === articleIdFromUrl);
         if (!articleToDisplay) {
             console.warn(`Article with ID "${articleIdFromUrl}" not found in articles.json.`);
         }
    }

    // 2. URLのIDで見つからなければ、デフォルトの初期表示URLが設定されているかチェック
    if (!articleToDisplay && defaultInitialArticleUrl) {
         // allArticles のデータから、defaultInitialArticleUrl と一致する filename を持つ記事を探す
         articleToDisplay = allArticles.find(article => article.filename === defaultInitialArticleUrl);
         if (!articleToDisplay) {
             console.warn(`Article with filename "${defaultInitialArticleUrl}" (defaultInitialArticleUrl) not found in articles.json.`);
         }
    }

    // 3. 上記で見つからなければ、articles.json の最初の記事をチェック
    if (!articleToDisplay && allArticles.length > 0) {
         articleToDisplay = allArticles[0];
    }

    // ★★★ 記事が見つかったら表示、そうでなければメッセージ ★★★
    if (articleToDisplay) {
         // 表示する記事が見つかった場合、その記事のデータオブジェクト全体を renderMarkdown に渡す
         renderMarkdown(articleToDisplay); // ★修正：記事データオブジェクト全体を渡す ★
         // 該当記事のリンクにアクティブクラスを付ける
         const initialLink = articleListElement.querySelector(`a[href="#${articleToDisplay.id}"]`);
         if (initialLink) {
             initialLink.classList.add('active');
         }
    } else {
         // 表示する記事が articles.json に見つからなかった場合
         markdownViewer.innerHTML = allArticles.length > 0 ? '<p>記事を選択してください。</p>' : '<p>記事がまだありません。</p>';
    }
}


// ページが全て読み込まれた後に実行
document.addEventListener('DOMContentLoaded', () => {
    // 記事一覧を読み込み・表示する関数を呼び出し
    loadArticleList();
    // 初期表示のロジックは loadArticleList の中で呼び出すように変更
});
