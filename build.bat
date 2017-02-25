@echo off
>"dist\ol.editor.js" (for /r "src\" %%F in (*.js) do type "%%F")
>"dist\ol.editor.css" (for /r "src\" %%F in (*.css) do type "%%F")
