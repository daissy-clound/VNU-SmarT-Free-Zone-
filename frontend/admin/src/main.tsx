import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import viVN from "antd/locale/vi_VN";
import App from "./App";
import "antd/dist/reset.css";
import "./styles.css";
import { registerServiceWorker } from "./push";

// Service worker cho PWA ca trực: nhận Web Push, bấm thông báo mở thẳng phiếu
void registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#17634c",
          borderRadius: 10,
          fontFamily: '"Be Vietnam Pro", "Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
          colorText: "#223c33",
          fontSize: 15,
          controlHeight: 40,
          colorBgLayout: "#f3f6f4",
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
