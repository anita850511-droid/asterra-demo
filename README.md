# Asterra v4.6.1 — 即時預覽方向修正版

修正 v4.6 WebGL 角色預覽上下方向錯誤，造成臉部翻折／倒置的問題。

## 這版修正
- 修正角色影像的 WebGL texture Y 軸取樣方向。
- 改用新的 app-v461.js / styles-v461.css，避免 GitHub Pages 快取舊檔。
- 使用新的 localStorage key，避免舊測試狀態干擾。
- 保留 v4.6 的即時臉部／身形參數測試功能。

## GitHub Pages
將本資料夾內全部內容上傳到 repo 根目錄並覆蓋 index.html。
確認左上角顯示 `v4.6.1 LIVE PREVIEW FIX`。
