@echo off
echo [1/4] Parcheando Java 17 en capacitor.build.gradle...
powershell -Command "(Get-Content 'app\capacitor.build.gradle') -replace 'JavaVersion.VERSION_21', 'JavaVersion.VERSION_17' | Set-Content 'app\capacitor.build.gradle'"

echo [2/4] Parcheando Java 17 en plugins de Capacitor (node_modules)...
powershell -Command "Get-ChildItem -Path '..\node_modules\@capacitor' -Filter 'build.gradle' -Recurse | ForEach-Object { (Get-Content $_.FullName) -replace 'JavaVersion.VERSION_21', 'JavaVersion.VERSION_17' | Set-Content $_.FullName }"

echo [3/4] Ejecutando Gradle...
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo BUILD FALLIDO
    exit /b 1
)
echo [4/4] BUILD EXITOSO!
echo APK en: app\build\outputs\apk\debug\app-debug.apk
