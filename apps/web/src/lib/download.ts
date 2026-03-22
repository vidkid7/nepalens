/**
 * Trigger a file download in the browser.
 * Fetches the file as a blob then creates an object URL,
 * which guarantees the browser save-dialog appears
 * regardless of same-origin or cross-origin URLs.
 */
export async function triggerFileDownload(
  url: string,
  filename: string
): Promise<void> {
  // Ensure absolute URL for fetch
  const fetchUrl = url.startsWith("http") ? url : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file (HTTP ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  // If the response is HTML instead of a file, the URL probably 404'd or redirected
  if (contentType.includes("text/html")) {
    throw new Error("Download URL returned an HTML page instead of a file");
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("Downloaded file is empty");
  }

  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up after a short delay so the browser can start the download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 200);
}
