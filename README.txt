介紹：
 此應用僅做私人帳號備忘事件管理，功能包括，顯示內容、新增事件、修改事件、刪除事件。

實作項目：
 nodejs + express + google calendar api

環境需求：
 nodejs

架設步驟：
 1. 進入下列連結取得google api憑證
    https://developers.google.com/drive/activity/v1/quickstart/nodejs#step_1_turn_on_the

 2. 依序進行下列步驟：
    a. 點選按鈕 "enable the google drive activity api"
    b. 建立新的專案，或者選取現有專案
    c. 下載憑證檔
    d. 將憑證取名 credentials.json 放到專案根目錄
    e. 開啟終端機於專案根目錄執行 npm install
    f. 執行 npm start

開啟瀏覽器在連結欄輸入：
 localhost:3001

注意：
 初次使用時，點Load按鈕後需要取得google驗證碼，回到終端機會收到驗證連結，開啟連結取得驗證碼後於終端機輸入，再回到瀏覽器即可執行。

