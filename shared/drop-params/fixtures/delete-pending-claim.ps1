# Test-only Windows deletion handle. EOF always closes the handle.
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PendingClaim {
    [StructLayout(LayoutKind.Sequential)]
    public struct Disposition { public byte Delete; }
    [StructLayout(LayoutKind.Sequential)]
    public struct Standard {
        public long AllocationSize, EndOfFile;
        public uint NumberOfLinks;
        public byte DeletePending, Directory;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern IntPtr CreateFile(string name, uint access, uint share,
        IntPtr security, uint creation, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool SetFileInformationByHandle(IntPtr handle, int kind,
        ref Disposition info, uint size);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool GetFileInformationByHandleEx(IntPtr handle, int kind,
        out Standard info, uint size);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool CloseHandle(IntPtr handle);
}
'@
$handle = [IntPtr]::Zero
try {
    [Console]::WriteLine('{"status":"ready"}')
    while ($null -ne ($line = [Console]::ReadLine())) {
        $request = $line | ConvertFrom-Json
        if ($request.action -eq 'hold') {
            if ($handle -ne [IntPtr]::Zero) { throw 'A deletion handle is already held' }
            $handle = [PendingClaim]::CreateFile($request.path, 0x10000, 7, [IntPtr]::Zero, 3, 0x80, [IntPtr]::Zero)
            if ($handle -eq [IntPtr](-1)) { throw "CreateFile: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())" }
            $disposition = New-Object PendingClaim+Disposition
            $disposition.Delete = 1
            if (-not [PendingClaim]::SetFileInformationByHandle($handle, 4, [ref]$disposition, 1)) {
                throw "Set disposition: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())"
            }
            $information = New-Object PendingClaim+Standard
            if (-not [PendingClaim]::GetFileInformationByHandleEx($handle, 1, [ref]$information, 24)) {
                throw "Get disposition: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())"
            }
            $probe = [PendingClaim]::CreateFile($request.path, [uint32]2147483648, 7, [IntPtr]::Zero, 3, 0x80, [IntPtr]::Zero)
            $openError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
            if ($probe -ne [IntPtr](-1)) { [void][PendingClaim]::CloseHandle($probe); throw 'Pending file opened unexpectedly' }
            if ($information.DeletePending -ne 1 -or $openError -ne 5) { throw 'Expected native delete-pending access denial' }
            [Console]::WriteLine('{"status":"pending","deletePending":true,"openError":5}')
        } elseif ($request.action -eq 'release') {
            if ($handle -eq [IntPtr]::Zero) { throw 'No deletion handle is held' }
            if (-not [PendingClaim]::CloseHandle($handle)) { throw 'CloseHandle failed' }
            $handle = [IntPtr]::Zero
            [Console]::WriteLine('{"status":"released"}')
        } else { throw 'Unknown fixture action' }
    }
} finally {
    if ($handle -ne [IntPtr]::Zero -and $handle -ne [IntPtr](-1)) {
        [void][PendingClaim]::CloseHandle($handle)
    }
}
