if (!window.__ENCLESO_INITIALIZED__) {
  window.__ENCLESO_INITIALIZED__ = true;

  console.log("[Encleso Demo] Initializing Encleso integration script...");

  const EMPTY_COMBOSELECT = "<option selected>Choose...</option>";
  const CAPCTL_UNSUPPORTED_INNERHTML = "Unsupported";
  const CAPCOMBO_UNSUPPORTEDCAP_INNERHTML = `<option selected>- ${CAPCTL_UNSUPPORTED_INNERHTML} -</option>`;

  function SetScannerCapsControlsState(bReady, jsonCaps = null) {
    if (bReady == false) {
      $("#btnScan").prop("disabled", true);
      $("#resolution").html(EMPTY_COMBOSELECT).attr("disabled", true);
      $("#colorMode").html(EMPTY_COMBOSELECT).attr("disabled", true);
      $("#chkDuplex").attr("disabled", true);
      $("#chkShowUI").attr("disabled", true);
    } else {
      $("#btnScan").prop("disabled", jsonCaps == null ? true : false);
      $("#chkShowUI").attr("disabled", jsonCaps == null ? true : false);

      if (jsonCaps && jsonCaps.Resolution && jsonCaps.Resolution.Values.length > 0) {
        let options = "";
        for (let i = 0; i < jsonCaps.Resolution.Values.length; i++) {
          options +=
            `<option ${i == jsonCaps.Resolution.CurrentIndex ? "selected" : ""} value="${jsonCaps.Resolution.Values[i]}">` +
            jsonCaps.Resolution.Values[i] +
            " x " +
            jsonCaps.Resolution.Values[i] +
            `</option>`;
        }
        $("#resolution").html(options).attr("disabled", !jsonCaps.Resolution.ChangeAllowed);
      } else {
        $("#resolution").html(CAPCOMBO_UNSUPPORTEDCAP_INNERHTML).attr("disabled", true);
      }

      if (jsonCaps && jsonCaps.PixelType && jsonCaps.PixelType.Values.length > 0) {
        let options = "";
        for (let i = 0; i < jsonCaps.PixelType.Values.length; i++) {
          const val = jsonCaps.PixelType.Values[i];
          options +=
            `<option ${i == jsonCaps.PixelType.CurrentIndex ? "selected" : ""} value="${val}">` +
            Encleso.PixelTypeToString(val) +
            `</option>`;
        }
        $("#colorMode").html(options).attr("disabled", !jsonCaps.PixelType.ChangeAllowed);
      } else {
        $("#colorMode").html(CAPCOMBO_UNSUPPORTEDCAP_INNERHTML).attr("disabled", true);
      }

      if (jsonCaps && jsonCaps.Duplex.Supported) {
        $("#chkDuplex").attr("disabled", false);
        $("#chkDuplex").prop("checked", jsonCaps.Duplex.Enabled);
      } else {
        $("#chkDuplex").attr("disabled", true);
      }
    }
  }

  function SaveImageToFilesystem() {
    const format = $("#imageFormat option:selected").val();
    Encleso.SaveImageToFilesystem(format, [0]);
  }

  function ShowScannedImage(bValid, imgIndex = 0, msgError = "") {
    if (bValid == false) {
      if (msgError == "") {
        $("#alert-warn-error").addClass("d-none").removeClass("d-block").html(msgError);
      } else {
        $("#alert-warn-error").removeClass("d-none").addClass("d-block").html(msgError);
      }
      $("#imageFormat").prop("disabled", true);
      $("#btnSave").prop("disabled", true);
    } else {
      Encleso.GetImagePreview(imgIndex).then((ret) => {
        if (ret == null || ret.length < 1 || ret == "") return ShowScannedImage(false, 0, "Invalid Image!");

        $("#alert-warn-error").removeClass("d-block").addClass("d-none").html("");
        $("#ScanOutput").removeClass("d-none").addClass("d-block");
        $("#ScanOutput").attr("src", ret);

        $("#imageFormat").prop("disabled", false);
        $("#btnSave").prop("disabled", false);
      });
    }
  }

  async function ClearImageLibrary() {
    const ScannedImageCount = await Encleso.ImageLibGetCount();
    const ImgLibIndexList = [];
    for (let i = 0; i < ScannedImageCount; i++) ImgLibIndexList.push(i);
    await Encleso.ImageLibRemove(ImgLibIndexList);
  }

 async function scan() {
  const ScannerName = window.ExportedScannerNames;

  if (!ScannerName) {
    throw new Error("No scanner selected");
  }
  const ShowUI = $("#chkShowUI").is(":checked");

  const Caps = {};
  if ($("#resolution").prop("disabled") === false) Caps.Resolution = $("#resolution option:selected").val();
  if ($("#colorMode").prop("disabled") === false) Caps.PixelType = $("#colorMode option:selected").val();
  if ($("#chkDuplex").prop("disabled") === false) Caps.Duplex = $("#chkDuplex").prop("checked");
  Encleso.SetCapabilities(Caps);

  await ClearImageLibrary();

  try {
    const ret = await Encleso.StartScan(ScannerName[0], ShowUI);
    console.log("Scan result:", ret);


    

    if (!ret || typeof ret.ScannedImagesCount !== 'number' || ret.ScannedImagesCount < 1) {
      ShowScannedImage(false, 0, "Scan was cancelled or no images scanned!");
      throw new Error("Scan was cancelled or no images scanned");
    }

    ShowScannedImage(true, 0);

    return ret;
  } catch (err) {
    ShowScannedImage(false, 0, err.message || "Unknown scan error");
    throw err;
  }
}


  async function StartScanning() {
    try {
      await scan();
    } catch (err) {
      console.error("Scan error:", err);
    }
  }

  function GetScannerCaps() {
    const ScannerName = window.ExportedScannerNames

    SetScannerCapsControlsState(false);
    if (ScannerName ) return;

    Encleso.GetCapabilities(ScannerName).then((ret) => {
      SetScannerCapsControlsState(true, ret);
    });
  }

  if (typeof window !== "undefined") {
    console.log("[Encleso Demo] Script loaded, waiting for Encleso library...");

    let retryCount = 0;
    const maxRetries = 100;

    const setHandlers = () => {
      if (typeof Encleso === "undefined") {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error(
            "[Encleso Demo] Failed to load Encleso library after 5 seconds. Check if the Encleso service is running.",
          );
          return;
        }
        console.log(`[Encleso Demo] Encleso not ready yet, retrying... (${retryCount}/${maxRetries})`);
        setTimeout(setHandlers, 50);
        return;
      }

      console.log("[Encleso Demo] Encleso library found, setting up handlers...");
      console.log(
        "[Encleso Demo] Available Encleso functions:",
        Object.getOwnPropertyNames(Encleso).filter((name) => typeof Encleso[name] === "function"),
      );
      console.log("[Encleso Demo] Full Encleso object:", Encleso);

      if (Encleso["#IsConnected"] === false) {
        console.log("[Encleso Demo] WebSocket not connected. Attempting automatic reconnection...");
        console.log("[Encleso Demo] Target URL:", Encleso["#WEBSOCKET_URL"]);

        if (typeof Encleso.Connect === "function") {
          console.log("[Encleso Demo] Calling Encleso.Connect() to trigger connection...");
          try {
            Encleso.Connect();
          } catch (e) {
            console.log("[Encleso Demo] Connect() call failed:", e);
          }
        }

        console.log("[Encleso Demo] Testing client app reachability...");
        try {
          const testSocket = new WebSocket(Encleso["#WEBSOCKET_URL"]);
          testSocket.onopen = () => {
            console.log("[Encleso Demo] Client app is reachable! Closing test connection...");
            testSocket.close();
          };
          testSocket.onerror = () => {
            console.log("[Encleso Demo] Client app is NOT reachable. Is it running?");
          };
          setTimeout(() => {
            if (testSocket.readyState === WebSocket.CONNECTING) {
              testSocket.close();
            }
          }, 2000);
        } catch (e) {
          console.log("[Encleso Demo] Could not test client app reachability:", e);
        }

        if (Encleso["#WebSocket"]) {
          console.log("[Encleso Demo] WebSocket state:", Encleso["#WebSocket"].readyState);
          if (Encleso["#WebSocket"].readyState === WebSocket.CLOSED) {
            console.log("[Encleso Demo] WebSocket is closed, library should reconnect automatically");
          }
        }

        let connectionAttempts = 0;
        const maxAttempts = 200;

        const waitForConnection = () => {
          if (Encleso["#IsConnected"] === true) {
            console.log("[Encleso Demo] WebSocket connected successfully!");
            setupEnclesoHandlers();
            setupConnectionMonitor();
          } else if (connectionAttempts >= maxAttempts) {
            console.error("[Encleso Demo] Failed to connect after 10 seconds. Client app may not be running.");
            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html("Cannot connect to Encleso client app. Please ensure it's running and try again.");
            return;
          } else {
            if (connectionAttempts % 20 === 0) {
              console.log("[Encleso Demo] Attempting to trigger connection again...");
              if (typeof Encleso.Connect === "function") {
                try {
                  Encleso.Connect();
                } catch (e) {
                  console.log("[Encleso Demo] Reconnection attempt failed:", e);
                }
              }
            }

            console.log(`[Encleso Demo] Still waiting for connection... (${connectionAttempts}/${maxAttempts})`);
            connectionAttempts++;
            setTimeout(waitForConnection, 50);
          }
        };

        waitForConnection();
        return;
      }

      setupConnectionMonitor();
      setupEnclesoHandlers();

      function setupConnectionMonitor() {
        let lastConnectionStatus = Encleso["#IsConnected"];

        setInterval(() => {
          const currentStatus = Encleso["#IsConnected"];

          if (currentStatus !== lastConnectionStatus) {
            if (currentStatus === false && lastConnectionStatus === true) {
              console.log("[Encleso Demo] Connection lost! Attempting to reconnect...");
              $("#ScannerName").html(EMPTY_COMBOSELECT);
              SetScannerCapsControlsState(true, null);
              $("#alert-warn-error")
                .removeClass("d-none")
                .addClass("d-block")
                .html("Connection lost. Attempting to reconnect...");

              delete window.StartScanning;
              delete window.SaveImageToFilesystem;
              delete window.scan;

              attemptReconnection();
            } else if (currentStatus === true && lastConnectionStatus === false) {
              console.log("[Encleso Demo] Connection restored!");
              $("#alert-warn-error").removeClass("d-block").addClass("d-none").html("");
              setupEnclesoHandlers();
            }

            lastConnectionStatus = currentStatus;
          }
        }, 1000);
      }

      function attemptReconnection() {
        console.log("[Encleso Demo] Attempting automatic reconnection...");

        if (Encleso["#WebSocket"]) {
          console.log("[Encleso Demo] WebSocket state:", Encleso["#WebSocket"].readyState);
        }

        setTimeout(() => {
          if (Encleso["#IsConnected"] === false) {
            console.log("[Encleso Demo] Auto-reconnection failed. Client app may need to be restarted.");
            $("#alert-warn-error").html("Connection lost. The Encleso client app may need to be restarted.");
          }
        }, 3000);
      }

      function setupEnclesoHandlers() {
        Encleso.OnError = (err) => {
          $("#ScannerName").html(EMPTY_COMBOSELECT);
          SetScannerCapsControlsState(true, null);
          $("#alert-warn-error").removeClass("d-none").addClass("d-block").html(err.Message);
        };

        Encleso.OnReady = (ret) => {
          console.log("[Encleso] Connected to client application successfully!");
          console.log("[Encleso] Available scanners:", ret.ScannersList);

          window.ExportedScannerNames = ret.ScannersList;
          console.log("Exported scanner names:", window.ExportedScannerNames);

          if (ret.ScannersList.length < 1) {
            $("#ScannerName").html(EMPTY_COMBOSELECT);
            SetScannerCapsControlsState(true, null);
            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html("No scanners were found! Check that your scanner is connected and turned on.");
            return;
          }

          // === FIX: add value attributes to options for proper .val() retrieval ===
          let options = "";
          for (let i = 0; i < ret.ScannersList.length; i++) {
            options += `<option value="${ret.ScannersList[i]}" ${i == ret.DefaultIndex ? "selected" : ""}>${ret.ScannersList[i]}</option>`;
          }
          $("#ScannerName").html(options);

          $("#ScannerName").on("change", (event) => {
            ShowScannedImage(false);
            $("#alert-warn-error").removeClass("d-block").addClass("d-none").html("");
            GetScannerCaps();
          });

          SetScannerCapsControlsState(false);
          GetScannerCaps();

          window.StartScanning = StartScanning;
          window.SaveImageToFilesystem = SaveImageToFilesystem;
          window.scan = scan;
          window.Encleso = Encleso;
        };
      }
    };

    setHandlers();
  }
}
