(function () {
  const config = window.JILI_ARCHIVE_ACCESS_CONFIG || {};
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", ""]);
  const isLocal = localHosts.has(window.location.hostname);

  function endpointUrl(endpoint, assetId, action) {
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}asset_id=${encodeURIComponent(assetId)}&action=${encodeURIComponent(action)}`;
  }

  function showMessage(message) {
    window.alert(message);
  }

  async function openSignedUrl(target, assetId, action) {
    if (!config.endpoint || config.enabled !== true) {
      showMessage("外部访问服务还没有配置。当前只保留本地回看路径，部署后需要接入临时签名链接服务。");
      return;
    }

    target.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(endpointUrl(config.endpoint, assetId, action), {
        method: "GET",
        credentials: config.credentials || "omit"
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload || !payload.url) {
        throw new Error("missing url");
      }
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showMessage("临时链接生成失败，请稍后重试或联系管理员。");
    } finally {
      target.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-archive-access-action]");
    if (!target) return;

    const action = target.getAttribute("data-archive-access-action") || "";
    const assetId = target.getAttribute("data-asset-id") || "";

    if (action === "show_record_only") {
      event.preventDefault();
      showMessage("合同文件只记录归档状态，不公开展示，也不提供下载链接。");
      return;
    }

    if (action === "pending_cos_upload") {
      event.preventDefault();
      showMessage("这个文件已经入库，但还没有上传到云端，暂时不能生成外部访问链接。");
      return;
    }

    if (isLocal && config.localArchiveEnabled === true && target.getAttribute("href")) {
      return;
    }

    if (!assetId || action === "local_only") {
      event.preventDefault();
      showMessage("这个文件还没有匹配到云端资产清单。");
      return;
    }

    event.preventDefault();
    openSignedUrl(target, assetId, action);
  });
})();
