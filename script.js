// script.js

// PDF.js ライブラリをESモジュールとしてインポート
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';

// PDF.js のワーカーファイルの場所を指定（必須）
// HTMLで type="module" を使って worker を読み込んでいる場合でも、
// ここでワーカーのURLを明示的に指定するのが推奨されています。
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

// ★★★ 追加：CMapファイルと標準フォントデータの場所を明示的に指定 ★★★
// 日本語表示などに必要な追加ファイルへのパスです。
// ご利用のPDF.jsのバージョン(4.0.379)に合わせたCDN上のパスを指定します。
pdfjsLib.GlobalWorkerOptions.cMapUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/cmaps/';
pdfjsLib.GlobalWorkerOptions.cMapPacked = true; // cmaps.json などのパックされたCMapを使用する場合 (CDNでは通常こちら)

// 標準フォントデータが必要な場合（必要に応じて追加）
pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/standard_fonts/';

// getDocument 関数を取得
const getDocument = pdfjsLib.getDocument;

// 現在の読み込みタスクを保持する変数（重複表示対策用）
let currentLoadingTask = null;

// 初期表示するPDFファイルのパス
// TODO: 初期表示したいPDFファイルのパスを正しく記述してください
let currentPdfUrl = './blogs/sagawa_semantic_space_human_ai.pdf';


// PDFを表示するコンテナ要素
const pdfViewer = document.getElementById('pdf-viewer');

// 記事一覧リストを表示する要素
const articleListElement = document.getElementById('article-list');


// PDFファイルを読み込み、各ページを描画する関数
async function renderPdf(pdfUrl) {
    // 新しいPDF読み込み開始前に、以前の表示内容をクリアし、読み込み中のメッセージを表示
    // これにより、古い表示が残ったまま新しいPDFが描画されるのを防ぎます。
    pdfViewer.innerHTML = '<p>読み込み中...</p>';

    // 以前の読み込みタスクが進行中であれば、それを中断または無視するためのロジック
    // ここでは、新しいタスクが始まったら古いタスクの完了後の処理をスキップする方式を採用
    if (currentLoadingTask) {
        // 以前のタスク情報をクリア（これにより、古いタスクの完了後に描画が実行されるのを防ぐ）
        // PDF.js の getDocument() が返すタスクオブジェクトの .destroy() は完全なキャンセルを保証しないため、
        // 最新タスクのチェックで描画を中断するロジックが効果的です。
    }


    try {
        // PDFドキュメントを非同期で読み込みます
        const loadingTask = getDocument(pdfUrl);
        currentLoadingTask = loadingTask; // 新しいタスクを currentLoadingTask にセット

        const pdf = await loadingTask.promise;

        // ★★★ 重複表示対策: ここで、このタスクが最新のものであるかチェック ★★★
        // await が完了した時点で、他の renderPdf が呼ばれていないか確認
        if (loadingTask !== currentLoadingTask) {
             console.log("Loading task was superseded, abandoning render for", pdfUrl);
             return; // このタスクは最新ではないため描画を中断
        }
        // ★★★ チェック終わり ★★★


        // PDFの総ページ数を取得
        const numPages = pdf.numPages;
        console.log(`PDFには ${numPages} ページあります。`); // デバッグ用にページ数をコンソール表示

        // PDF読み込み成功後、以前の表示内容を再度クリアし、PDFページを追加する準備
        // renderPdfの冒頭でもクリアしていますが、非同期処理中にクリックされた場合の
        // 重複描画を防ぐため、ここで再度クリアします。
        pdfViewer.innerHTML = '';


        // 各ページを順番に描画します
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            // ページを取得
            const page = await pdf.getPage(pageNum);

             // ★★★ 重複表示対策: 各ページ描画前にも、タスクが最新かチェック ★★★
            // 各ページの描画は非同期であり時間がかかる可能性があるため、
            // 各ページを描画する直前にも、このタスクがまだ最新であるかを確認します。
            if (loadingTask !== currentLoadingTask) {
                console.log("Rendering page", pageNum, "abandoned.");
                 // ★★★ 中断する場合、取得したページのクリーンアップ ★★★
                page.cleanup(); // メモリリーク防止
                return; // 最新でないタスクでの描画を中断
            }
             // ★★★ チェック終わり ★★★


            // ページを描画するためのCanvas要素を作成
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const pageContainer = document.createElement('div'); // 各ページを囲むコンテナ
            pageContainer.classList.add('pdf-page'); // スタイルのためのクラスを追加（CSS参照）

            // PDFページのビューポート（表示領域）を設定
            // スケールを調整して、PDFのサイズを制御できます
            const viewport = page.getViewport({ scale: 1.5 }); // 例：表示スケールを1.5倍に調整
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // ページを描画するためのコンテキストを設定し、描画を実行
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise; // 描画が完了するのを待つ

            // 作成したCanvasをページコンテナに追加
            pageContainer.appendChild(canvas);
            // ページコンテナをPDF表示領域に追加
            pdfViewer.appendChild(pageContainer);

            // ★★★ 描画完了したページのクリーンアップ ★★★
            // メモリ使用量を抑えるために、ページのレンダリングが完了したらクリーンアップします
            page.cleanup();

        }

    } catch (error) {
        // エラーが発生した場合の処理
         // キャンセルによるエラー（RenderingCancelledExceptionなど）は無視する場合
         // PDF.js のキャンセル機構に依存するため、正確なエラー名確認が必要
         // 上記の最新タスクチェックで描画を中断するため、このケースは少なくなるはずです。
         if (error.name === 'RenderingCancelledException') {
             console.log("Rendering was cancelled.");
             // この場合はエラーメッセージを表示せず中断
             return;
         }

        console.error('PDFの読み込みまたは描画中にエラーが発生しました:', error);
        pdfViewer.innerHTML = '<p>PDFの読み込みに失敗しました。ファイルが存在するか、正しい形式か確認してください。</p>';
    } finally {
        // ★★★ タスク完了またはエラーで、現在のタスクが自身のタスクと一致する場合のみ currentLoadingTask をクリア ★★★
        // これにより、最新のタスクではない場合に currentLoadingTask が意図せずクリアされるのを防ぎます
        if (loadingTask === currentLoadingTask) {
             currentLoadingTask = null;
        }
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

            link.href = `#${article.id}`; // リンク先を記事IDに（JavaScriptで制御するため実質ダミー）
            link.textContent = article.title; // リンクのテキストを記事タイトルに

            // リンクにクリックイベントリスナーを追加
            link.addEventListener('click', (event) => {
                event.preventDefault(); // デフォルトのリンク遷移（ページ内ジャンプなど）を防ぐ
                console.log(`記事タイトル「${article.title}」がクリックされました。対応ファイル: ${article.filename}`);

                // クリックされた記事のPDFを表示
                renderPdf(article.filename);

                // Optional: アクティブなリンクにスタイルを適用
                // 現在アクティブなリンクからクラスを削除
                if (document.querySelector('#article-list .active')) {
                    document.querySelector('#article-list .active').classList.remove('active');
                }
                // クリックされたリンクにアクティブクラスを追加
                event.target.classList.add('active');

                // Optional: モバイル表示でメニューを閉じるなどの処理をここに追加することも考えられます
            });


            listItem.appendChild(link);
            articleListElement.appendChild(listItem);
        });

        // ★★★ 初期表示する記事の制御 ★★★
        // ページ読み込み時、記事一覧が読み込まれた後に実行
        // もし currentPdfUrl が設定されていればその記事を表示
        // 設定されていなければ、記事リストの最初の記事を表示
        if (currentPdfUrl) {
             // currentPdfUrl に対応する記事が記事リストにあるか確認
             const initialArticle = articles.find(article => article.filename === currentPdfUrl);
             if (initialArticle) {
                renderPdf(currentPdfUrl);
                // 初期表示の記事リンクにアクティブクラスを付ける（Optional）
                 const initialLink = articleListElement.querySelector(`a[href="#${initialArticle.id}"]`);
                 if (initialLink) {
                     initialLink.classList.add('active');
                 }
             } else if (articles.length > 0) {
                 // 設定された初期URLの記事が見つからない場合、最初の記事を表示
                 currentPdfUrl = articles[0].filename;
                 renderPdf(currentPdfUrl);
                  const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
                  if (initialLink) {
                     initialLink.classList.add('active');
                  }
             } else {
                  // 記事が一つもない場合
                  pdfViewer.innerHTML = '<p>記事がまだありません。</p>';
             }
        } else if (articles.length > 0) {
             // 初期表示URLが設定されておらず、記事がある場合、最初の記事を表示
             currentPdfUrl = articles[0].filename;
             renderPdf(currentPdfUrl);
              const initialLink = articleListElement.querySelector(`a[href="#${articles[0].id}"]`);
              if (initialLink) {
                 initialLink.classList.add('active');
              }
        } else {
             // 記事が一つもない場合
             pdfViewer.innerHTML = '<p>記事がまだありません。</p>';
        }


    } catch (error) {
        console.error('記事一覧の読み込み中にエラーが発生しました:', error);
        articleListElement.innerHTML = '<li>記事一覧の読み込みに失敗しました。articles.json ファイルを確認してください。</li>';
        pdfViewer.innerHTML = '<p>記事一覧の読み込みに失敗しました。</p>';
    }
}


// ページが全て読み込まれた後に実行
document.addEventListener('DOMContentLoaded', () => {
    // 記事一覧を読み込み・表示する関数を呼び出し
    loadArticleList();
});
