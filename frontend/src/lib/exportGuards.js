/** Whether a CV preview download button should be disabled for a given format. */
export function isDownloadDisabled(loading, selectedCvId, selectedCv, format) {
  const pathPresent = format === "pdf" ? !!selectedCv?.pdf_path : !!selectedCv?.docx_path
  return Boolean(loading.export || loading.convoCv || !selectedCvId || !pathPresent)
}
