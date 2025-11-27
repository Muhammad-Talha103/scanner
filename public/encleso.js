if (!window.__ENCLESO_INITIALIZED__) {
  window.__ENCLESO_INITIALIZED__ = true;

  const EMPTY_COMBOSELECT = "<option selected>Choose...</option>";
  const CAPCTL_UNSUPPORTED_INNERHTML = "Unsupported";
  const CAPCOMBO_UNSUPPORTEDCAP_INNERHTML = `<option selected>- ${CAPCTL_UNSUPPORTED_INNERHTML} -</option>`;

  let monitorIntervalId = null;
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

      if (
        jsonCaps &&
        jsonCaps.Resolution &&
        jsonCaps.Resolution.Values.length > 0
      ) {
        let options = "";
        for (let i = 0; i < jsonCaps.Resolution.Values.length; i++) {
          options +=
            `<option ${i == jsonCaps.Resolution.CurrentIndex ? "selected" : ""} value="${jsonCaps.Resolution.Values[i]}">` +
            jsonCaps.Resolution.Values[i] +
            " x " +
            jsonCaps.Resolution.Values[i] +
            `</option>`;
        }
        $("#resolution")
          .html(options)
          .attr("disabled", !jsonCaps.Resolution.ChangeAllowed);
      } else {
        $("#resolution")
          .html(CAPCOMBO_UNSUPPORTEDCAP_INNERHTML)
          .attr("disabled", true);
      }

      if (
        jsonCaps &&
        jsonCaps.PixelType &&
        jsonCaps.PixelType.Values.length > 0
      ) {
        let options = "";
        for (let i = 0; i < jsonCaps.PixelType.Values.length; i++) {
          const val = jsonCaps.PixelType.Values[i];
          options +=
            `<option ${i == jsonCaps.PixelType.CurrentIndex ? "selected" : ""} value="${val}">` +
            Encleso.PixelTypeToString(val) +
            `</option>`;
        }
        $("#colorMode")
          .html(options)
          .attr("disabled", !jsonCaps.PixelType.ChangeAllowed);
      } else {
        $("#colorMode")
          .html(CAPCOMBO_UNSUPPORTEDCAP_INNERHTML)
          .attr("disabled", true);
      }

      if (jsonCaps && jsonCaps.Duplex && jsonCaps.Duplex.Supported) {
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
        $("#alert-warn-error")
          .addClass("d-none")
          .removeClass("d-block")
          .html(msgError);
      } else {
        $("#alert-warn-error")
          .removeClass("d-none")
          .addClass("d-block")
          .html(msgError);
      }
      $("#imageFormat").prop("disabled", true);
      $("#btnSave").prop("disabled", true);
    } else {
      Encleso.GetImagePreview(imgIndex).then((ret) => {
        if (ret == null || ret.length < 1 || ret == "")
          return ShowScannedImage(false, 0, "Invalid Image!");

        $("#alert-warn-error")
          .removeClass("d-block")
          .addClass("d-none")
          .html("");
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
    const selectedFromDom = $("#ScannerName").val();
    const exported = window.ExportedScannerNames || [];
    const ScannerName = selectedFromDom || exported[0];
    if (!ScannerName) {
      throw new Error("No scanner selected");
    }

    const ShowUI = $("#chkShowUI").is(":checked");

    const Caps = {};
    if ($("#resolution").prop("disabled") === false) {
      const resVal = $("#resolution option:selected").val();
      const numericRes = parseInt(String(resVal).toString().split(" ")[0], 10);
      if (!isNaN(numericRes)) Caps.Resolution = numericRes;
    }
    if ($("#colorMode").prop("disabled") === false) {
      const pixVal = $("#colorMode option:selected").val();
      const numericPix = Number(pixVal);
      if (!isNaN(numericPix)) Caps.PixelType = numericPix;
    }
    if ($("#chkDuplex").prop("disabled") === false)
      Caps.Duplex = $("#chkDuplex").prop("checked");

    try {
      if (Object.keys(Caps).length > 0) {
        await Encleso.SetCapabilities(Caps);
      }
    } catch (err) {
      // console.warn("SetCapabilities failed before scan:", err);
    }

    await ClearImageLibrary();

    try {
      const ret = await Encleso.StartScan(ScannerName, ShowUI);

      if (
        !ret ||
        typeof ret.ScannedImagesCount !== "number" ||
        ret.ScannedImagesCount < 1
      ) {
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
  if (typeof window !== "undefined") {
    let retryCount = 0;
    const maxRetries = 100;

    const setHandlers = () => {
      if (typeof Encleso === "undefined") {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error(
            "[Encleso Demo] Failed to load Encleso library after multiple attempts. Check if the Encleso service is running."
          );
          return;
        }

        setTimeout(setHandlers, 50);
        return;
      }

      if (Encleso === false) {
        let connectionAttempts = 0;
        const maxAttempts = 200;

        const startTime = Date.now();
        const maxDuration = 15000;

        const waitForConnection = () => {
          if (Date.now() - startTime >= maxDuration) {
            console.error(
              "Unable to connect. Please check if another tab is already open that has loaded Encleso."
            );

            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html(
                "Cannot connect to Encleso client app. Please ensure it's running, and check if another tab is already using it."
              );

            return; // Stop sending further requests
          }

          if (Encleso === true) {
            setupEnclesoHandlers();
            setupConnectionMonitor();
          } else if (connectionAttempts >= maxAttempts) {
            // console.error(
            //   "[Encleso Demo] Failed to connect after attempts. Client app may not be running."
            // );
            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html(
                "Cannot connect to Encleso client app. Please ensure it's running and try again."
              );
            return;
          } else {
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
        let lastConnected = true;

        monitorIntervalId = setInterval(async () => {
          try {
            await Encleso.GetClientAppVersion();
            if (!lastConnected) {
              lastConnected = true;

              $("#alert-warn-error")
                .removeClass("d-block")
                .addClass("d-none")
                .html("");
              setupEnclesoHandlers();
            }
          } catch (err) {
            if (lastConnected) {
              lastConnected = false;

              $("#ScannerName").html("<option selected>Choose...</option>");
              SetScannerCapsControlsState(true, null);
              $("#alert-warn-error")
                .removeClass("d-none")
                .addClass("d-block")
                .html("Connection lost. Please check Encleso client app.");

              delete window.StartScanning;
              delete window.SaveImageToFilesystem;
              delete window.scan;

              attemptReconnection();
            }
          }
        }, 5000);
      }

      function attemptReconnection() {
        setTimeout(async () => {
          try {
            await Encleso.GetClientAppVersion();
          } catch (e) {
            $("#alert-warn-error").html(
              "Still not connected. Please restart Encleso client app."
            );
          }
        }, 3000);
      }

      function setupEnclesoHandlers() {
        Encleso.OnError = (err) => {
          $("#ScannerName").html(EMPTY_COMBOSELECT);
          SetScannerCapsControlsState(true, null);
          $("#alert-warn-error")
            .removeClass("d-none")
            .addClass("d-block")
            .html(err.Message);
        };

        Encleso.OnReady = async (ret) => {
          if (
            typeof monitorIntervalId !== "undefined" &&
            monitorIntervalId !== null
          ) {
            clearInterval(monitorIntervalId);
            monitorIntervalId = null;
          }

          let userEmail = window.__USER_EMAIL__;

          try {
            if (!userEmail) {
              // console.warn("No email found → Running scanner in FREE MODE.");

              $("#alert-warn-error")
                .removeClass("d-none")
                .addClass("d-block")
                .html("Free Mode Active — No license applied.");
            } else {
              const resp = await fetch(
                `/api/encleso?email=${encodeURIComponent(userEmail)}`,
                {
                  method: "GET",
                  credentials: "same-origin",
                }
              );

              const json = await resp.json();

              if (!resp.ok || !json.token) {
                $("#alert-warn-error")
                  .removeClass("d-none")
                  .addClass("d-block")
                  .html("Failed to fetch license token.");
                return;
              }

              // Apply license
              const licState = await Encleso.SetLicense(json.token).catch(
                () => false
              );
              if (!licState || licState.ReturnCode !== 0) {
                $("#alert-warn-error")
                  .removeClass("d-none")
                  .addClass("d-block")
                  .html("Failed to apply license.");
                return;
              }

              // console.log("License applied successfully.");
            }
          } catch (err) {
            // console.error("License flow error:", err);
            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html("Unable to contact license server.");
          }

          window.ExportedScannerNames = ret.ScannersList || [];
          if (!window.ExportedScannerNames.length) {
            $("#ScannerName").html(EMPTY_COMBOSELECT);
            SetScannerCapsControlsState(true, null);
            $("#alert-warn-error")
              .removeClass("d-none")
              .addClass("d-block")
              .html("No scanners detected. Please connect a scanner.");
            return;
          }

          // Populate scanner dropdown
          let options = "";
          for (let i = 0; i < ret.ScannersList.length; i++) {
            options += `<option value="${ret.ScannersList[i]}" ${i == ret.DefaultIndex ? "selected" : ""}>${ret.ScannersList[i]}</option>`;
          }
          $("#ScannerName").html(options);

          $("#ScannerName").on("change", () => {
            ShowScannedImage(false);
            $("#alert-warn-error")
              .removeClass("d-block")
              .addClass("d-none")
              .html("");
          });

          SetScannerCapsControlsState(false);

          // Export functions globally
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
