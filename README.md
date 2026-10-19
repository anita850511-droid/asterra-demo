# Asterra 活世界 Demo

這是一個完全靜態、目前沒有串 OpenAI API 的第一版原型。

## 目前包含
- 世界地圖 / 城市地圖
- 四座城市
- 市內與跨城市移動時間
- 市政廳：承租 / 購屋 / 新建概念
- 社會住宅、房租、房屋介面
- 家具與特殊活動解鎖
- AI 居民自主移動（本地模擬）
- 同地點面對面互動
- AI 不會因為同地點就一直重複搭話
- 親密互動可接受 / 猶豫 / 拒絕
- 非上帝視角
- 城市事件
- LocalStorage 保存瀏覽器內遊玩狀態

## GitHub Pages 發布
1. 在 GitHub 建立新的 Public repository，建議名稱：`asterra-demo`
2. 把 `index.html`、`styles.css`、`app.js`、`README.md` 放到 repository 根目錄
3. Repository → Settings → Pages
4. Build and deployment → Source：Deploy from a branch
5. Branch：main，Folder：/ (root)
6. Save
7. 等待 GitHub 顯示 Pages 網址

目前沒有使用 GPT，因此不會產生 OpenAI API 費用。
