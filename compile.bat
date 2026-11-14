@echo off
REM ══════════════════════════════════════════════════════════════════
REM  compile.bat — Compile ludo.cpp → ludo.js via Emscripten
REM  Run this ONCE after installing emsdk to replace the JS port.
REM ══════════════════════════════════════════════════════════════════

echo Setting up Emscripten environment...
call emsdk\emsdk_env.bat

echo Compiling ludo.cpp ...
emcc ludo.cpp -o ludo.js ^
  -s EXPORTED_FUNCTIONS="['_newGame','_rollDice','_moveToken','_tokenRow','_tokenCol','_isActive','_currentPlayer','_getDice','_getWinner','_canMoveToken','_getMessage']" ^
  -s EXPORTED_RUNTIME_METHODS="['cwrap']" ^
  -s MODULARIZE=0 ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -O2

if %ERRORLEVEL% == 0 (
    echo.
    echo [SUCCESS] ludo.js compiled successfully from C++!
    echo Open index.html in your browser to play.
) else (
    echo.
    echo [ERROR] Compilation failed. Make sure emsdk is installed:
    echo   cd emsdk
    echo   emsdk install latest
    echo   emsdk activate latest
)
pause

