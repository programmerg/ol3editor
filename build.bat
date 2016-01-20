@echo off
copy /y "ol3ditor.css" "dist\ol3ditor.css"
>"dist\ol3ditor.js" (for /r "src\" %%F in (*.js) do type "%%F")