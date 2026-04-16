import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Loader from "../../components/Loader";
import { apiUrl } from "../../config/api";
import useFetch from "../../hooks/useFetch";
import type { RootState } from "../../store/store";

type LogoContentResponse =
  | string
  | {
      html?: string;
      content?: string;
      data?: string;
    };

const extractHtml = (payload: LogoContentResponse | null) => {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";

  if (typeof payload.html === "string") return payload.html.trim();
  if (typeof payload.content === "string") return payload.content.trim();
  if (typeof payload.data === "string") return payload.data.trim();

  return "";
};

type FileContentLocationState = {
  htmlContent?: string;
  pageTitle?: string;
  fileId?: string | number;
};

const FileContentPage = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [requestedFileId, setRequestedFileId] = useState("");
  const [iframeHeight, setIframeHeight] = useState("0px");
  const location = useLocation() as { state?: FileContentLocationState | null };
  const { selectedFile } = useSelector((state: RootState) => state.file);
  const selectedFileId = selectedFile?.id ?? location.state?.fileId ?? null;
  const routeHtmlContent = useMemo(
    () => extractHtml(location.state?.htmlContent ?? null),
    [location.state?.htmlContent]
  );

  const { data, loading, error, fetchData } = useFetch<LogoContentResponse>(
    apiUrl(selectedFileId ? `logo-content/${selectedFileId}` : "logo-content"),
    "GET",
    false
  );

  useEffect(() => {
    if (routeHtmlContent) {
      setRequestedFileId(selectedFileId ? String(selectedFileId) : "");
      return;
    }

    if (!selectedFileId) {
      setRequestedFileId("");
      return;
    }

    setRequestedFileId(String(selectedFileId));
    fetchData();
  }, [fetchData, routeHtmlContent, selectedFileId]);

  const fetchedHtmlContent = useMemo(() => extractHtml(data), [data]);
  const htmlContent = routeHtmlContent || fetchedHtmlContent;
  const pageTitle = location.state?.pageTitle || (selectedFile?.filename
    ? `${selectedFile.filename} content page`
    : "File content page");

  const updateIframeHeight = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;

    const nextHeight = Math.max(
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0
    );

    if (nextHeight > 0) {
      setIframeHeight(`${nextHeight}px`);
    }
  }, []);

  const handleFrameLoad = useCallback(() => {
    updateIframeHeight();

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    const doc = iframeRef.current?.contentDocument;
    if (!doc || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateIframeHeight();
    });

    if (doc.documentElement) observer.observe(doc.documentElement);
    if (doc.body) observer.observe(doc.body);
    resizeObserverRef.current = observer;
  }, [updateIframeHeight]);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Loader loading={loading} text="Loading page content..." />

      {!loading &&
        !error &&
        requestedFileId === (selectedFileId ? String(selectedFileId) : "") &&
        !!htmlContent && (
        <iframe
          ref={iframeRef}
          title={pageTitle}
          srcDoc={htmlContent}
          onLoad={handleFrameLoad}
          style={{
            width: "100%",
            height: iframeHeight,
            border: "0",
            display: "block",
          }}
        />
      )}
    </>
  );
};

export default FileContentPage;
