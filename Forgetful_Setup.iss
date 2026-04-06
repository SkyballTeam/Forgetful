[Setup]
AppName=Forgetful
AppVersion=1.0
DefaultDirName={autopf}\Forgetful
DefaultGroupName=Forgetful
OutputDir=.\Installer
OutputBaseFilename=Forgetful_Setup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
; We don't need UserInfoPage anymore as we'll use a custom one
UserInfoPage=no

[Files]
Source: "Build\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Forgetful"; Filename: "{app}\Forgetful.exe"
Name: "{commondesktop}\Forgetful"; Filename: "{app}\Forgetful.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Code]
var
  LicensePage: TInputQueryWizardPage;

function VerifyLicenseKey(Key: string): Boolean;
var
  WinHttpReq: Variant;
  Url: string;
  JsonPayload: string;
  ResponseText: string;
begin
  Result := False;
  Url := 'https://forgetful-backend.onrender.com/api/verify-key';
  
  // Construct simple JSON payload
  JsonPayload := '{"key": "' + Key + '"}';
  
  try
    WinHttpReq := CreateOleObject('WinHttp.WinHttpRequest.5.1');
    WinHttpReq.Open('POST', Url, False);
    WinHttpReq.SetRequestHeader('Content-Type', 'application/json');
    WinHttpReq.Send(JsonPayload);
    
    if WinHttpReq.Status = 200 then
    begin
      ResponseText := WinHttpReq.ResponseText;
      // Simple JSON check for Inno Setup 
      if (Pos('"valid":true', ResponseText) > 0) or (Pos('"valid": true', ResponseText) > 0) then
      begin
        Result := True;
      end;
    end
    else
    begin
      MsgBox('Error connecting to the verification server. HTTP Status: ' + IntToStr(WinHttpReq.Status), mbError, MB_OK);
    end;
  except
    MsgBox('Failed to reach the verification server. Please ensure you have an active internet connection.', mbError, MB_OK);
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = LicensePage.ID then
  begin
    if Trim(LicensePage.Values[0]) = '' then
    begin
      MsgBox('Please enter a license key.', mbError, MB_OK);
      Result := False;
    end
    else
    begin
      // Let the user know it's checking
      WizardForm.NextButton.Enabled := False;
      try
        Result := VerifyLicenseKey(Trim(LicensePage.Values[0]));
      finally
        WizardForm.NextButton.Enabled := True;
      end;
      
      if not Result then
      begin
        MsgBox('Invalid or Expired License Key. Please check the key and try again.', mbError, MB_OK);
      end
      else
      begin
        MsgBox('License Key Verified successfully! Proceeding with installation.', mbInformation, MB_OK);
      end;
    end;
  end;
end;

procedure InitializeWizard;
begin
  // Create a custom page for the License Key
  LicensePage := CreateInputQueryPage(wpWelcome,
    'Premium License Activation', 
    'Verification required',
    'Please enter your license key to continue the installation. You can find this key in your purchase confirmation email.');
  
  // Add an input field
  LicensePage.Add('License Key:', False);
end;
