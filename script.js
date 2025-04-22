// script.js

// Marked.js ライブラリは HTML で <script> タグで読み込んでいるため、marked.parse() などがグローバルに利用可能
// MathJax ライブラリも HTML で <script> タグで読み込んでいるため、MathJax オブジェクトがグローバルに利用可能


// TODO: 初期表示したい記事のMarkdownファイルのパスを記述してください
// URLのクエリパラメータに id がない場合、この currentArticleUrl の記事が表示されます。
// 特定の初期表示がない場合は、null または空文字列にしてください。
let currentArticleUrl = './blogs/sagawa_semantic_space_human_ai.md'; // 例：デフォルトの初期表示記事パス


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
        console.log("Markdown content loaded and parsed:", htmlContent);
        // 変換したHTMLをMarkdown表示領域に表示
        markdownViewer.innerHTML = htmlContent;

        // MathJax に、新しく表示されたコンテンツの数式をレンダリングさせる
        // Marked.js で変換された HTML が DOM に追加された後に MathJax を実行します。
        // MathJax.typesetPromise() は非同期でレンダリングを行い、完了を Promise で返します。
        // #pdf-viewer (markdownViewer) 要素内の数式をレンダリング対象とします。
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            try {
                // MathJax の初期化が完了するのを待つ
                await MathJax.startup.promise;
                // 初期化完了後に typesetPromise を実行
                await MathJax.typesetPromise([markdownViewer]);
            } catch (error) {
                console.error('MathJax のレンダリング中にエラーが発生しました:', error);
            }
        } else {
            console.warn('MathJax が正しく読み込まれていない可能性があります。');
        }

    } catch (error) {
        console.error('Markdownファイルの読み込みまたは描画中にエラーが発生しました:', error);
        markdownViewer.innerHTML = '<p>記事の読み込みに失敗しました。ファイルが存在するか、正しい形式か確認してください。</p>';
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

             // リスト項目にタイトルリンクを追加
            listItem.appendChild(link);

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

            articleListElement.appendChild(listItem); // 生成したリスト項目を記事一覧に追加

        });

        // ★★★ 初期表示する記事の制御（修正） ★★★
        // ページ読み込み時、記事一覧が読み込まれた後に実行
        // MathJax が完全にロードされるのを待ってから最初の記事を表示
        // MathJax オブジェクト、startup オブジェクト、および promise プロパティ全てが存在するか厳密にチェック
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            await MathJax.startup.promise; // MathJax のロード完了を待機
        } else {
             // MathJax オブジェクトや startup, promise が利用可能でない場合
             console.warn("MathJax startup promise is not available for initial render. Initial render might not display math correctly. Check if MathJax script is correctly loaded in HTML and initialized.");
        }

        // ★★★ 修正：表示する記事を決定するロジック ★★★
        let articleToDisplay = null; // 表示する記事データオブジェクト

        // 1. URLのクエリパラメータに記事IDがあるかチェック
        // URLSearchParams は ? 以降のクエリ文字列を簡単に扱える組み込みオブジェクト
        const urlParams = new URLSearchParams(window.location.search);
        const articleIdFromUrl = urlParams.get('id'); // URLから 'id' パラメータの値を取得 (例: ?id=article1 の 'article1')

        if (articleIdFromUrl) {
             // URLにIDがある場合、そのIDに一致する記事を articles から探す
             articleToDisplay = articles.find(article => article.id === articleIdFromUrl);
             if (!articleToDisplay) {
                 console.warn(`Article with ID "${articleIdFromUrl}" not found in articles.json.`);
                 // 指定されたIDの記事が見つからなければ、articleToDisplay は null のまま
             }
        }

        // 2. URLのIDで見つからなければ、currentArticleUrl が設定されているかチェック
        // currentArticleUrl が初期設定されている場合や、前の記事表示で設定されている場合など
        if (!articleToDisplay && currentArticleUrl) {
             // articles.json のデータから、currentArticleUrl と一致する filename を持つ記事を探す
             articleToDisplay = articles.find(article => article.filename === currentArticleUrl);
             if (!articleToDisplay) {
                 console.warn(`Article with filename "${currentArticleUrl}" (currentArticleUrl) not found in articles.json.`);
             }
        }

        // 3. 上記で見つからなければ、articles.json の最初の記事をチェック
        // 記事が一つ以上ある場合に適用
        if (!articleToDisplay && articles.length > 0) {
             articleToDisplay = articles[0]; // articles.json の最初の記事をデフォルトとして表示
        }

        // ★★★ 記事が見つかったら表示、そうでなければメッセージ ★★★
        if (articleToDisplay) {
             // 表示する記事が見つかった場合、その記事のファイル名で renderMarkdown を呼び出す
             renderMarkdown(articleToDisplay.filename);
             // 該当記事のリンクにアクティブクラスを付ける
             const initialLink = articleListElement.querySelector(`a[href="#${articleToDisplay.id}"]`);
             if (initialLink) {
                 initialLink.classList.add('active');
             }
        } else {
             // 表示する記事が articles.json に見つからなかった場合（例: articles.json が空、指定されたID/filename が存在しないなど）
             // articles.json に記事が一つ以上ある場合は「記事を選択してください」
             // articles.json に記事が一つもない場合は「記事がまだありません」
             markdownViewer.innerHTML = articles.length > 0 ? '<p>記事を選択してください。</p>' : '<p>記事がまだありません。</p>';
        }
        // ★★★ 修正終わり ★★★


    } catch (error) {
        // articles.json の読み込み自体に失敗した場合などのエラーハンドリング
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
