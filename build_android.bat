@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr
cd /d "%~dp0android"
call gradlew.bat assembleDebug
