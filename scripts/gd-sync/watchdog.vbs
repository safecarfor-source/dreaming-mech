' 극동 동기화 워치독 — 상주 프로세스가 죽었으면 재시작
' 시작 프로그램에 등록되며, 10분마다 체크
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Do While True
    ' pythonw가 gd_upload.py를 실행 중인지 확인
    Set objWMI = GetObject("winmgmts:\\.\root\cimv2")
    Set processes = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name='pythonw.exe'")

    found = False
    For Each proc In processes
        If InStr(LCase(proc.CommandLine), "gd_upload") > 0 Then
            found = True
            Exit For
        End If
    Next

    If Not found Then
        ' 로그 기록
        If fso.FileExists("C:\gd-sync\upload.log") Then
            Set logFile = fso.OpenTextFile("C:\gd-sync\upload.log", 8, True)
            logFile.WriteLine "[" & Now & "] [WATCHDOG] 프로세스 죽음 감지! 재시작..."
            logFile.Close
        End If
        ' 재시작
        WshShell.Run "pythonw C:\gd-sync\gd_upload.py", 0, False
    End If

    WScript.Sleep 600000  ' 10분 대기
Loop
